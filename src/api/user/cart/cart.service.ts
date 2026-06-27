import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ItemStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

type Actor = { customerId?: string; guestToken?: string };

export type CartItemResponse = {
  id: string;
  quantity: number;
  isSelected: boolean;
  productId: string;
  variantId: string | null;
  product: {
    id: string;
    title: string;
    slug: string;
    thumbnailUrl: string | null;
  };
  variant: {
    id: string;
    sku: string;
    price: string;
    availableStock: number;
  } | null;
};

export type CartResponse = {
  id: string;
  items: CartItemResponse[];
  itemCount: number;
  selectedCount: number;
  selectedTotal: string;
};

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private assertActor(actor: Actor): asserts actor is {
    customerId?: string;
    guestToken?: string;
  } {
    if (!actor.customerId && !actor.guestToken) {
      throw new BadRequestException('Either customerId or guestToken is required');
    }
  }

  private async validateVariant(
    tx: Prisma.TransactionClient,
    payload: AddToCartDto,
  ) {
    const { productId, variantId } = payload;
    const variant = await tx.productVariant.findFirst({
      where: {
        id: variantId,
        productId,
        status: ItemStatus.ACTIVE,
      },
      include: {
        inventory: true,
      },
    });

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    return variant;
  }

  private async validateProduct(
    tx: Prisma.TransactionClient,
    productId: string,
  ) {
    const product = await tx.product.findFirst({
      where: {
        id: productId,
        status: ItemStatus.ACTIVE,
        deletedAt: null,
      },
      include: {
        variants: {
          where: { status: ItemStatus.ACTIVE, isBase: true },
          include: { inventory: true },
          take: 1,
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const baseVariant = product.variants[0];
    if (!baseVariant) {
      throw new BadRequestException('No active purchasable variant found');
    }

    return baseVariant;
  }

  private getAvailableStock(variant: {
    quantity: number;
    inventory: { quantityOnHand: number; quantityReserved: number } | null;
  }): number {
    if (!variant.inventory) {
      return Math.max(0, variant.quantity);
    }

    return Math.max(
      0,
      variant.inventory.quantityOnHand - variant.inventory.quantityReserved,
    );
  }

  private async findOrCreateCart(tx: Prisma.TransactionClient, actor: Actor) {
    this.assertActor(actor);

    const existing = await tx.cart.findFirst({
      where: actor.customerId
        ? { customerId: actor.customerId }
        : { customerToken: actor.guestToken },
    });

    if (existing) {
      return existing;
    }

    return tx.cart.create({
      data: actor.customerId
        ? { customerId: actor.customerId }
        : { customerToken: actor.guestToken! },
    });
  }

  private async findCart(tx: Prisma.TransactionClient, actor: Actor) {
    this.assertActor(actor);
    return tx.cart.findFirst({
      where: actor.customerId
        ? { customerId: actor.customerId }
        : { customerToken: actor.guestToken },
    });
  }

  private mapCartItem(
    item: {
      id: string;
      quantity: number;
      isSelected: boolean;
      productId: string;
      variantId: string | null;
      product: {
        id: string;
        title: string;
        slug: string;
        thumbnail: { url: string } | null;
      };
      variant: {
        id: string;
        sku: string;
        price: Prisma.Decimal;
        quantity: number;
        inventory: { quantityOnHand: number; quantityReserved: number } | null;
      } | null;
    },
  ): CartItemResponse {
    let availableStock = 0;
    if (item.variant) {
      const inv = item.variant.inventory;
      availableStock = inv
        ? Math.max(0, inv.quantityOnHand - inv.quantityReserved)
        : Math.max(0, item.variant.quantity);
    }

    return {
      id: item.id,
      quantity: item.quantity,
      isSelected: item.isSelected,
      productId: item.productId,
      variantId: item.variantId,
      product: {
        id: item.product.id,
        title: item.product.title,
        slug: item.product.slug,
        thumbnailUrl: item.product.thumbnail?.url ?? null,
      },
      variant: item.variant
        ? {
            id: item.variant.id,
            sku: item.variant.sku,
            price: item.variant.price.toString(),
            availableStock,
          }
        : null,
    };
  }

  private computeCartTotals(items: CartItemResponse[]) {
    const itemCount = items.reduce((s, i) => s + i.quantity, 0);
    const selectedCount = items
      .filter((i) => i.isSelected)
      .reduce((s, i) => s + i.quantity, 0);
    const selectedTotal = items
      .filter((i) => i.isSelected)
      .reduce((s, i) => {
        const price = parseFloat(i.variant?.price ?? '0');
        return s + price * i.quantity;
      }, 0)
      .toFixed(2);

    return { itemCount, selectedCount, selectedTotal };
  }

  async getCart(actor: Actor): Promise<CartResponse> {
    this.assertActor(actor);

    const cart = await this.prisma.cart.findFirst({
      where: actor.customerId
        ? { customerId: actor.customerId }
        : { customerToken: actor.guestToken },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
                status: true,
                deletedAt: true,
                thumbnail: { select: { url: true } },
              },
            },
            variant: {
              select: {
                id: true,
                sku: true,
                price: true,
                quantity: true,
                status: true,
                inventory: {
                  select: { quantityOnHand: true, quantityReserved: true },
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      return { id: '', items: [], itemCount: 0, selectedCount: 0, selectedTotal: '0.00' };
    }

    const items = cart.items
      .filter(
        (i) =>
          i.product.status === ItemStatus.ACTIVE &&
          i.product.deletedAt === null &&
          (i.variant === null || i.variant.status === ItemStatus.ACTIVE),
      )
      .map((i) => this.mapCartItem(i));

    const { itemCount, selectedCount, selectedTotal } =
      this.computeCartTotals(items);

    return { id: cart.id, items, itemCount, selectedCount, selectedTotal };
  }

  async addToCart(payload: AddToCartDto, actor: Actor) {
    this.assertActor(actor);

    return this.prisma.transaction(async (tx) => {
      const resolvedVariant = payload.variantId
        ? await this.validateVariant(tx, payload)
        : await this.validateProduct(tx, payload.productId);

      const variantId = resolvedVariant.id;
      const availableStock = this.getAvailableStock(resolvedVariant);
      const cart = await this.findOrCreateCart(tx, actor);

      const existingItem = await tx.cartItem.findFirst({
        where: { cartId: cart.id, variantId },
      });

      const nextQuantity =
        (existingItem?.quantity ?? 0) + Math.max(1, payload.quantity);
      if (nextQuantity > availableStock) {
        throw new BadRequestException(
          `Insufficient stock. Available quantity is ${availableStock}`,
        );
      }

      if (payload.buyNow) {
        await tx.cartItem.updateMany({
          where: { cartId: cart.id },
          data: { isSelected: false },
        });
      }

      if (existingItem) {
        return tx.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: nextQuantity,
            isSelected: payload.buyNow ? true : existingItem.isSelected,
          },
          include: {
            product: { select: { id: true, title: true, slug: true } },
            variant: { select: { id: true, sku: true, price: true } },
          },
        });
      }

      return tx.cartItem.create({
        data: {
          cartId: cart.id,
          productId: payload.productId,
          variantId,
          quantity: payload.quantity,
          isSelected: true,
        },
        include: {
          product: { select: { id: true, title: true, slug: true } },
          variant: { select: { id: true, sku: true, price: true } },
        },
      });
    });
  }

  async updateCartItem(
    itemId: string,
    payload: UpdateCartItemDto,
    actor: Actor,
  ) {
    this.assertActor(actor);

    return this.prisma.transaction(async (tx) => {
      const cart = await this.findCart(tx, actor);
      if (!cart) {
        throw new NotFoundException('Cart not found');
      }

      const item = await tx.cartItem.findFirst({
        where: { id: itemId, cartId: cart.id },
        include: {
          variant: {
            select: {
              id: true,
              quantity: true,
              inventory: {
                select: { quantityOnHand: true, quantityReserved: true },
              },
            },
          },
        },
      });

      if (!item) {
        throw new NotFoundException('Cart item not found');
      }

      const updateData: Prisma.CartItemUpdateInput = {};

      if (payload.quantity !== undefined) {
        if (item.variant) {
          const available = this.getAvailableStock(item.variant);
          if (payload.quantity > available) {
            throw new BadRequestException(
              `Insufficient stock. Available: ${available}`,
            );
          }
        }
        updateData.quantity = payload.quantity;
      }

      if (payload.isSelected !== undefined) {
        updateData.isSelected = payload.isSelected;
      }

      return tx.cartItem.update({
        where: { id: itemId },
        data: updateData,
        include: {
          product: { select: { id: true, title: true, slug: true } },
          variant: { select: { id: true, sku: true, price: true } },
        },
      });
    });
  }

  async removeCartItem(itemId: string, actor: Actor) {
    this.assertActor(actor);

    return this.prisma.transaction(async (tx) => {
      const cart = await this.findCart(tx, actor);
      if (!cart) {
        throw new NotFoundException('Cart not found');
      }

      const item = await tx.cartItem.findFirst({
        where: { id: itemId, cartId: cart.id },
      });

      if (!item) {
        throw new NotFoundException('Cart item not found');
      }

      await tx.cartItem.delete({ where: { id: itemId } });
      return { removed: true };
    });
  }

  async clearCart(actor: Actor) {
    this.assertActor(actor);

    const cart = await this.prisma.cart.findFirst({
      where: actor.customerId
        ? { customerId: actor.customerId }
        : { customerToken: actor.guestToken },
    });

    if (!cart) {
      return { cleared: true };
    }

    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return { cleared: true };
  }

  async mergeCart(customerId: string, guestToken?: string) {
    if (!guestToken) {
      return { synced: false, reason: 'Guest token missing' };
    }

    return this.prisma.transaction(async (tx) => {
      const [guestCart, customerCart] = await Promise.all([
        tx.cart.findFirst({
          where: { customerToken: guestToken },
          include: { items: true },
        }),
        tx.cart.findFirst({
          where: { customerId },
          include: { items: true },
        }),
      ]);

      if (!guestCart) {
        return { synced: false, reason: 'Guest cart not found' };
      }

      if (!customerCart) {
        await tx.cart.update({
          where: { id: guestCart.id },
          data: {
            customerId,
            customerToken: null,
          },
        });

        return { synced: true, mergedItems: guestCart.items.length };
      }

      const customerItemMap = new Map<string, (typeof customerCart.items)[0]>();
      for (const item of customerCart.items) {
        customerItemMap.set(item.variantId ?? `product:${item.productId}`, item);
      }

      let mergedItems = 0;
      for (const guestItem of guestCart.items) {
        const key = guestItem.variantId ?? `product:${guestItem.productId}`;
        const customerItem = customerItemMap.get(key);

        if (customerItem) {
          await tx.cartItem.update({
            where: { id: customerItem.id },
            data: {
              quantity: customerItem.quantity + guestItem.quantity,
              isSelected: customerItem.isSelected || guestItem.isSelected,
            },
          });
        } else {
          await tx.cartItem.create({
            data: {
              cartId: customerCart.id,
              productId: guestItem.productId,
              variantId: guestItem.variantId,
              quantity: guestItem.quantity,
              isSelected: guestItem.isSelected,
            },
          });
          mergedItems += 1;
        }
      }

      await tx.cart.delete({ where: { id: guestCart.id } });
      return { synced: true, mergedItems };
    });
  }

  // kept for backward-compat; use mergeCart for new code
  async syncCart(customerId: string, guestToken?: string) {
    return this.mergeCart(customerId, guestToken);
  }
}
