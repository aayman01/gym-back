import { Injectable, NotFoundException } from '@nestjs/common';
import { ItemStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PublicCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const rows = await this.prisma.category.findMany({
      where: {
        deletedAt: null,
        status: ItemStatus.ACTIVE,
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        isFeature: true,
        image: { select: { id: true, url: true } },
      },
    });
    return rows;
  }

  async findBySlug(slug: string) {
    const row = await this.prisma.category.findFirst({
      where: {
        slug: slug.trim(),
        deletedAt: null,
        status: ItemStatus.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        isFeature: true,
        image: { select: { id: true, url: true } },
      },
    });
    if (!row) {
      throw new NotFoundException('Category not found');
    }
    return row;
  }
}
