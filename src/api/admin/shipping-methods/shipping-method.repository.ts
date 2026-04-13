import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export type ShippingMethodAdminRow =
  Prisma.ShippingMethodGetPayload<Record<string, never>>;

@Injectable()
export class ShippingMethodRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma;
  }

  buildListWhere(
    search?: string,
    isActive?: boolean,
  ): Prisma.ShippingMethodWhereInput {
    const trimmed = search?.trim();
    const and: Prisma.ShippingMethodWhereInput[] = [];

    if (trimmed) {
      and.push({
        name: { contains: trimmed, mode: 'insensitive' },
      });
    }

    if (isActive !== undefined) {
      and.push({ isActive });
    }

    return and.length > 0 ? { AND: and } : {};
  }

  async count(
    where: Prisma.ShippingMethodWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    return this.client(tx).shippingMethod.count({ where });
  }

  async findManyPaginated(
    where: Prisma.ShippingMethodWhereInput,
    skip: number,
    take: number,
    tx?: Prisma.TransactionClient,
  ): Promise<ShippingMethodAdminRow[]> {
    return this.client(tx).shippingMethod.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<ShippingMethodAdminRow | null> {
    return this.client(tx).shippingMethod.findUnique({
      where: { id },
    });
  }

  async create(
    data: Prisma.ShippingMethodCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<ShippingMethodAdminRow> {
    return this.client(tx).shippingMethod.create({ data });
  }

  async update(
    id: string,
    data: Prisma.ShippingMethodUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<ShippingMethodAdminRow> {
    return this.client(tx).shippingMethod.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, tx?: Prisma.TransactionClient) {
    return this.client(tx).shippingMethod.delete({
      where: { id },
    });
  }
}
