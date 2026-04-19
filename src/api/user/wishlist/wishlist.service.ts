import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ItemStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';

type Actor = { customerId?: string; guestToken?: string };

@Injectable()
export class WishlistService {
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
    payload: AddToWishlistDto,
  ) {
    if (!payload.variantId) {
      return;
    }

    const variant = await tx.productVariant.findFirst({
      where: {
        id: payload.variantId,
        productId: payload.productId,
        status: ItemStatus.ACTIVE,
      },
      select: { id: true },
    });

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }
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
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }
  }

  private async findOrCreateWishlist(
    tx: Prisma.TransactionClient,
    actor: Actor,
  ) {
    this.assertActor(actor);

    const existing = await tx.wishlist.findFirst({
      where: actor.customerId
        ? { customerId: actor.customerId }
        : { customerToken: actor.guestToken },
    });
    if (existing) {
      return existing;
    }

    return tx.wishlist.create({
      data: actor.customerId
        ? { customerId: actor.customerId }
        : { customerToken: actor.guestToken! },
    });
  }

  async addToWishlist(payload: AddToWishlistDto, actor: Actor) {
    this.assertActor(actor);

    return this.prisma.transaction(async (tx) => {
      await this.validateProduct(tx, payload.productId);
      await this.validateVariant(tx, payload);

      const wishlist = await this.findOrCreateWishlist(tx, actor);
      const existing = await tx.wishlistItem.findFirst({
        where: {
          wishlistId: wishlist.id,
          variantId: payload.variantId ?? null,
        },
      });

      if (existing) {
        return existing;
      }

      return tx.wishlistItem.create({
        data: {
          wishlistId: wishlist.id,
          productId: payload.productId,
          variantId: payload.variantId,
        },
        include: {
          product: { select: { id: true, title: true, slug: true } },
          variant: { select: { id: true, sku: true, price: true } },
        },
      });
    });
  }

  async syncWishlist(customerId: string, guestToken?: string) {
    if (!guestToken) {
      return { synced: false, reason: 'Guest token missing' };
    }

    return this.prisma.transaction(async (tx) => {
      const [guestWishlist, customerWishlist] = await Promise.all([
        tx.wishlist.findFirst({
          where: { customerToken: guestToken },
          include: { items: true },
        }),
        tx.wishlist.findFirst({
          where: { customerId },
          include: { items: true },
        }),
      ]);

      if (!guestWishlist) {
        return { synced: false, reason: 'Guest wishlist not found' };
      }

      if (!customerWishlist) {
        await tx.wishlist.update({
          where: { id: guestWishlist.id },
          data: {
            customerId,
            customerToken: null,
          },
        });

        return { synced: true, mergedItems: guestWishlist.items.length };
      }

      const existingVariantIds = new Set(
        customerWishlist.items.map((item) => item.variantId ?? `p:${item.productId}`),
      );

      let mergedItems = 0;
      for (const guestItem of guestWishlist.items) {
        const dedupeKey = guestItem.variantId ?? `p:${guestItem.productId}`;
        if (existingVariantIds.has(dedupeKey)) {
          continue;
        }

        await tx.wishlistItem.create({
          data: {
            wishlistId: customerWishlist.id,
            productId: guestItem.productId,
            variantId: guestItem.variantId,
          },
        });
        mergedItems += 1;
      }

      await tx.wishlist.delete({ where: { id: guestWishlist.id } });
      return { synced: true, mergedItems };
    });
  }
}
