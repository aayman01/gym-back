import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export const productAttributeListInclude = {
  _count: { select: { options: true } },
  options: {
    select: { value: true },
    orderBy: { order: 'asc' as const },
  },
} satisfies Prisma.ProductAttributeInclude;

export type ProductAttributeListPayload = Prisma.ProductAttributeGetPayload<{
  include: typeof productAttributeListInclude;
}>;

export const productAttributeDetailInclude = {
  options: { orderBy: { order: 'asc' as const } },
} satisfies Prisma.ProductAttributeInclude;

export type ProductAttributeDetailPayload = Prisma.ProductAttributeGetPayload<{
  include: typeof productAttributeDetailInclude;
}>;

@Injectable()
export class ProductAttributeRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma;
  }

  buildListWhere(search?: string): Prisma.ProductAttributeWhereInput {
    const trimmed = search?.trim();
    if (!trimmed) {
      return {};
    }
    return {
      name: { contains: trimmed, mode: 'insensitive' },
    };
  }

  async findMaxOrder(tx?: Prisma.TransactionClient): Promise<number> {
    const agg = await this.client(tx).productAttribute.aggregate({
      _max: { order: true },
    });
    return agg._max.order ?? -1;
  }

  async findMaxOptionOrder(
    attributeId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const agg = await this.client(tx).productAttributeOption.aggregate({
      where: { attributeId },
      _max: { order: true },
    });
    return agg._max.order ?? -1;
  }

  async count(
    where: Prisma.ProductAttributeWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    return this.client(tx).productAttribute.count({ where });
  }

  async findManyPaginated(
    where: Prisma.ProductAttributeWhereInput,
    skip: number,
    take: number,
    tx?: Prisma.TransactionClient,
  ): Promise<ProductAttributeListPayload[]> {
    return this.client(tx).productAttribute.findMany({
      where,
      skip,
      take,
      orderBy: { order: 'asc' },
      include: productAttributeListInclude,
    });
  }

  async findByIdWithOptions(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<ProductAttributeDetailPayload | null> {
    return this.client(tx).productAttribute.findUnique({
      where: { id },
      include: productAttributeDetailInclude,
    });
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ id: string; order: number } | null> {
    return this.client(tx).productAttribute.findUnique({
      where: { id },
      select: { id: true, order: true },
    });
  }

  async findOptionsByIds(ids: string[], tx?: Prisma.TransactionClient) {
    return this.client(tx).productAttributeOption.findMany({
      where: { id: { in: ids } },
    });
  }

  async findOptionsByAttributeId(
    attributeId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.client(tx).productAttributeOption.findMany({
      where: { attributeId },
    });
  }

  async createAttribute(
    data: { name: string; order: number },
    tx?: Prisma.TransactionClient,
  ) {
    return this.client(tx).productAttribute.create({
      data,
      select: { id: true, name: true, order: true },
    });
  }

  async createManyOptions(
    rows: Prisma.ProductAttributeOptionCreateManyInput[],
    tx?: Prisma.TransactionClient,
  ) {
    if (rows.length === 0) {
      return;
    }
    return this.client(tx).productAttributeOption.createMany({ data: rows });
  }

  async updateName(id: string, name: string, tx?: Prisma.TransactionClient) {
    return this.client(tx).productAttribute.update({
      where: { id },
      data: { name },
    });
  }

  async delete(id: string, tx?: Prisma.TransactionClient) {
    return this.client(tx).productAttribute.delete({ where: { id } });
  }

  async swapAttributeOrder(
    a: { id: string; order: number },
    b: { id: string; order: number },
    tx?: Prisma.TransactionClient,
  ) {
    const db = this.client(tx);
    const temp = a.order;
    await db.productAttribute.update({
      where: { id: a.id },
      data: { order: b.order },
    });
    await db.productAttribute.update({
      where: { id: b.id },
      data: { order: temp },
    });
  }

  async swapOptionOrder(
    o1: { id: string; order: number },
    o2: { id: string; order: number },
    tx?: Prisma.TransactionClient,
  ) {
    const db = this.client(tx);
    const temp = o1.order;
    await db.productAttributeOption.update({
      where: { id: o1.id },
      data: { order: o2.order },
    });
    await db.productAttributeOption.update({
      where: { id: o2.id },
      data: { order: temp },
    });
  }
}
