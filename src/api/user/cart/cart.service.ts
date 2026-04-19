import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ItemStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';

type Actor = { customerId?: string; guestToken?: string };

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

  async syncCart(customerId: string, guestToken?: string) {
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
}
