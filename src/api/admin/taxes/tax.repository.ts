import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export type TaxAdminRow = Prisma.TaxGetPayload<Record<string, never>>;

@Injectable()
export class TaxRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma;
  }

  notDeleted(): Prisma.TaxWhereInput {
    return { deletedAt: null };
  }

  buildListWhere(
    search?: string,
    isActive?: boolean,
  ): Prisma.TaxWhereInput {
    const trimmed = search?.trim();
    const and: Prisma.TaxWhereInput[] = [this.notDeleted()];

    if (trimmed) {
      and.push({
        name: { contains: trimmed, mode: 'insensitive' },
      });
    }

    if (isActive !== undefined) {
      and.push({ isActive });
    }

    return { AND: and };
  }

  async count(
    where: Prisma.TaxWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    return this.client(tx).tax.count({ where });
  }

  async findManyPaginated(
    where: Prisma.TaxWhereInput,
    skip: number,
    take: number,
    tx?: Prisma.TransactionClient,
  ): Promise<TaxAdminRow[]> {
    return this.client(tx).tax.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<TaxAdminRow | null> {
    return this.client(tx).tax.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findDefaultTax(
    tx?: Prisma.TransactionClient,
  ): Promise<TaxAdminRow | null> {
    return this.client(tx).tax.findFirst({
      where: {
        deletedAt: null,
        isDefault: true,
      },
    });
  }

  async resetDefaultTax(tx?: Prisma.TransactionClient) {
    return this.client(tx).tax.updateMany({
      where: {
        deletedAt: null,
        isDefault: true,
      },
      data: { isDefault: false },
    });
  }

  async create(
    data: Prisma.TaxCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<TaxAdminRow> {
    return this.client(tx).tax.create({ data });
  }

  async update(
    id: string,
    data: Prisma.TaxUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<TaxAdminRow> {
    return this.client(tx).tax.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string, tx?: Prisma.TransactionClient) {
    return this.client(tx).tax.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
