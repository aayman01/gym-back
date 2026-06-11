import { Injectable } from '@nestjs/common';
import { ItemStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PublicBrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.brand.findMany({
      where: {
        deletedAt: null,
        status: ItemStatus.ACTIVE,
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        logo: { select: { id: true, url: true } },
      },
    });
  }
}
