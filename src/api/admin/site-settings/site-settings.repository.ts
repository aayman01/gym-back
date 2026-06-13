import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export const siteSettingsInclude = {
  headerLogo: { select: { id: true, url: true } },
  footerLogo: { select: { id: true, url: true } },
  emailLogo: { select: { id: true, url: true } },
  favicon: { select: { id: true, url: true } },
} satisfies Prisma.StoreConfigInclude;

export type SiteSettingsPayload = Prisma.StoreConfigGetPayload<{
  include: typeof siteSettingsInclude;
}>;

@Injectable()
export class SiteSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma;
  }

  async findActive(tx?: Prisma.TransactionClient): Promise<SiteSettingsPayload | null> {
    return this.client(tx).storeConfig.findFirst({
      where: { deletedAt: null },
      include: siteSettingsInclude,
    });
  }

  async createDefault(tx?: Prisma.TransactionClient): Promise<SiteSettingsPayload> {
    return this.client(tx).storeConfig.create({
      data: {
        brandName: 'Crimson Forge',
        currency: 'USD',
      },
      include: siteSettingsInclude,
    });
  }

  async update(
    id: string,
    data: Prisma.StoreConfigUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<SiteSettingsPayload> {
    return this.client(tx).storeConfig.update({
      where: { id },
      data,
      include: siteSettingsInclude,
    });
  }
}
