import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InventoryMovementDirection,
  InventoryTransactionType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationHelper } from '@common/helpers/pagination.helper';
import type { IPaginatedResponse } from '@common/types/pagination.types';
import type { GetInventoryQueryDto } from './dto/get-inventory-query.dto';
import type { AdjustInventoryDto } from './dto/adjust-inventory.dto';

@Injectable()
export class AdminInventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: GetInventoryQueryDto,
  ): Promise<IPaginatedResponse<Record<string, unknown>>> {
    const { page, limit, search, lowStockOnly } = query;
    const offset = PaginationHelper.getOffset(page, limit);

    const variantWhere: Prisma.ProductVariantWhereInput = {
      product: { deletedAt: null },
    };

    if (search?.trim()) {
      const term = search.trim();
      variantWhere.OR = [
        { sku: { contains: term, mode: 'insensitive' } },
        { product: { title: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const allVariants = await this.prisma.productVariant.findMany({
      where: variantWhere,
      orderBy: { createdAt: 'asc' },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            lowStockThreshold: true,
            thumbnail: { select: { url: true } },
          },
        },
        inventory: true,
        attributes: {
          include: { option: { select: { value: true, attribute: { select: { name: true } } } } },
        },
      },
    });

    const rows = allVariants
      .map((v) => {
        const onHand = v.inventory?.quantityOnHand ?? 0;
        const reserved = v.inventory?.quantityReserved ?? 0;
        const available = Math.max(0, onHand - reserved);
        return {
          variantId: v.id,
          sku: v.sku,
          status: v.status,
          product: {
            id: v.product.id,
            title: v.product.title,
            slug: v.product.slug,
            thumbnailUrl: v.product.thumbnail?.url ?? null,
            lowStockThreshold: v.product.lowStockThreshold,
          },
          attributeLabel: v.attributes
            .map((a) => `${a.option.attribute.name}: ${a.option.value}`)
            .join(', '),
          quantityOnHand: onHand,
          quantityReserved: reserved,
          available,
          isLowStock: available <= v.product.lowStockThreshold,
          hasInventory: Boolean(v.inventory),
        };
      })
      .filter((r) => !lowStockOnly || r.isLowStock);

    const total = rows.length;
    const paginatedRows = rows.slice(offset, offset + limit);

    return PaginationHelper.formatResponse(paginatedRows, total, page, limit);
  }

  async getTransactions(variantId: string) {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, product: { deletedAt: null } },
      select: {
        id: true,
        sku: true,
        product: { select: { id: true, title: true } },
        inventory: true,
      },
    });

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    const transactions = await this.prisma.inventoryTransaction.findMany({
      where: { variantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return {
      variant: {
        id: variant.id,
        sku: variant.sku,
        product: variant.product,
        quantityOnHand: variant.inventory?.quantityOnHand ?? 0,
        quantityReserved: variant.inventory?.quantityReserved ?? 0,
      },
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        movementDirection: t.movementDirection,
        quantityChange: t.quantityChange,
        resultingQuantity: t.resultingQuantity,
        createdAt: t.createdAt,
      })),
    };
  }

  async adjust(
    variantId: string,
    dto: AdjustInventoryDto,
  ) {
    return this.prisma.transaction(async (tx) => {
      const variant = await tx.productVariant.findFirst({
        where: { id: variantId, product: { deletedAt: null } },
        include: { inventory: true },
      });

      if (!variant) {
        throw new NotFoundException('Variant not found');
      }

      let inv = variant.inventory;

      if (!inv) {
        inv = await tx.inventory.create({
          data: {
            variantId,
            quantityOnHand: 0,
            quantityReserved: 0,
          },
        });
      }

      const currentOnHand = inv.quantityOnHand;
      const reserved = inv.quantityReserved;
      const isStockIn = dto.type === 'STOCK_IN';
      const newOnHand = isStockIn
        ? currentOnHand + dto.quantity
        : currentOnHand - dto.quantity;

      if (!isStockIn && newOnHand < reserved) {
        throw new BadRequestException(
          `Cannot reduce stock below reserved quantity (${reserved}). Available: ${Math.max(0, currentOnHand - reserved)}.`,
        );
      }

      if (!isStockIn && newOnHand < 0) {
        throw new BadRequestException(
          `Cannot reduce stock below zero. Current on hand: ${currentOnHand}.`,
        );
      }

      const updated = await tx.inventory.update({
        where: { variantId },
        data: { quantityOnHand: newOnHand },
      });

      await tx.inventoryTransaction.create({
        data: {
          variantId,
          movementDirection: isStockIn
            ? InventoryMovementDirection.IN
            : InventoryMovementDirection.OUT,
          type: isStockIn
            ? InventoryTransactionType.STOCK_IN
            : InventoryTransactionType.STOCK_OUT,
          quantityChange: isStockIn ? dto.quantity : -dto.quantity,
          resultingQuantity: newOnHand,
        },
      });

      return {
        variantId,
        sku: variant.sku,
        previousOnHand: currentOnHand,
        newOnHand: updated.quantityOnHand,
        quantityReserved: reserved,
        available: Math.max(0, updated.quantityOnHand - reserved),
      };
    });
  }
}
