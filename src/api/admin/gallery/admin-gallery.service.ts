import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationHelper } from '../../../common/helpers/pagination.helper';
import type { IPaginatedResponse } from '../../../common/types/pagination.types';
import { GetGalleryQueryDto } from './dto/get-gallery-query.dto';
import { AddToGalleryDto } from './dto/add-to-gallery.dto';
import { SwapGalleryOrderDto } from './dto/swap-gallery-order.dto';

export type AdminGalleryRow = {
  id: string;
  displayOrder: number;
  media: {
    id: string;
    url: string;
    key: string;
    mimeType: string;
    size: number;
    createdAt: Date;
  };
};

@Injectable()
export class AdminGalleryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: GetGalleryQueryDto,
  ): Promise<IPaginatedResponse<AdminGalleryRow>> {
    const { page, limit, search } = query;
    const offset = PaginationHelper.getOffset(page, limit);

    const searchFilter: Prisma.AdminGalleryItemWhereInput | undefined = search
      ?.trim()
      ? {
          media: {
            OR: [
              { id: { contains: search.trim(), mode: 'insensitive' } },
              { key: { contains: search.trim(), mode: 'insensitive' } },
            ],
          },
        }
      : undefined;

    const where: Prisma.AdminGalleryItemWhereInput = {
      ...(searchFilter ? { AND: [searchFilter] } : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.adminGalleryItem.count({ where }),
      this.prisma.adminGalleryItem.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { displayOrder: 'asc' },
        include: {
          media: {
            select: {
              id: true,
              url: true,
              key: true,
              mimeType: true,
              size: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    const data: AdminGalleryRow[] = rows.map((r) => ({
      id: r.id,
      displayOrder: r.displayOrder,
      media: r.media,
    }));

    return PaginationHelper.formatResponse(data, total, page, limit);
  }

  async addToGallery(_adminId: string, dto: AddToGalleryDto) {
    const media = await this.prisma.adminMedia.findUnique({
      where: { id: dto.mediaId },
    });
    if (!media) {
      throw new NotFoundException('Media not found');
    }

    const existing = await this.prisma.adminGalleryItem.findUnique({
      where: { mediaId: dto.mediaId },
    });
    if (existing) {
      throw new ConflictException('Media is already in the gallery');
    }

    const count = await this.prisma.adminGalleryItem.count();
    return this.prisma.adminGalleryItem.create({
      data: {
        mediaId: dto.mediaId,
        displayOrder: count,
      },
      include: {
        media: {
          select: {
            id: true,
            url: true,
            key: true,
            mimeType: true,
            size: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async swapOrder(dto: SwapGalleryOrderDto) {
    await this.prisma.transaction(async (tx) => {
      const [a, b] = await Promise.all([
        tx.adminGalleryItem.findUnique({ where: { mediaId: dto.mediaId1 } }),
        tx.adminGalleryItem.findUnique({ where: { mediaId: dto.mediaId2 } }),
      ]);
      if (!a || !b) {
        throw new NotFoundException('One or both gallery items were not found');
      }
      const orderA = a.displayOrder;
      const orderB = b.displayOrder;
      await tx.adminGalleryItem.update({
        where: { id: a.id },
        data: { displayOrder: orderB },
      });
      await tx.adminGalleryItem.update({
        where: { id: b.id },
        data: { displayOrder: orderA },
      });
    });
  }

  async findOne(mediaId: string) {
    const row = await this.prisma.adminGalleryItem.findUnique({
      where: { mediaId },
      include: {
        media: {
          select: {
            id: true,
            url: true,
            key: true,
            mimeType: true,
            size: true,
            createdAt: true,
          },
        },
      },
    });
    if (!row) {
      throw new NotFoundException('Gallery item not found');
    }
    return row;
  }

  async removeFromGallery(mediaId: string) {
    const row = await this.prisma.adminGalleryItem.findUnique({
      where: { mediaId },
    });
    if (!row) {
      throw new NotFoundException('Gallery item not found');
    }
    await this.prisma.adminGalleryItem.delete({ where: { id: row.id } });
    return { removed: true, mediaId };
  }
}
