import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationHelper } from '@common/helpers/pagination.helper';
import type { PaginatedSearchQueryDto } from '@common/dto/paginated-search-query.dto';

type BannerInput = {
  title?: string;
  description?: string | null;
  buttonText?: string | null;
  buttonLink?: string | null;
  mediaId?: string | null;
};

@Injectable()
export class AdminBannersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(payload: BannerInput) {
    const max = await this.prisma.banner.aggregate({ _max: { displayOrder: true } });
    const row = await this.prisma.banner.create({
      data: {
        title: payload.title!,
        description: payload.description ?? null,
        buttonText: payload.buttonText ?? null,
        buttonLink: payload.buttonLink ?? null,
        mediaId: payload.mediaId ?? null,
        displayOrder: (max._max.displayOrder ?? -1) + 1,
      },
      include: { media: { select: { id: true, url: true } } },
    });
    return this.map(row);
  }

  async findAll(query: PaginatedSearchQueryDto) {
    const { page, limit, search } = query;
    const offset = PaginationHelper.getOffset(page, limit);
    const where: Prisma.BannerWhereInput = search
      ? { title: { contains: search.trim(), mode: 'insensitive' } }
      : {};
    const [total, rows] = await Promise.all([
      this.prisma.banner.count({ where }),
      this.prisma.banner.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { displayOrder: 'asc' },
        include: { media: { select: { id: true, url: true } } },
      }),
    ]);
    return PaginationHelper.formatResponse(rows.map((r) => this.map(r)), total, page, limit);
  }

  async findOne(id: string) {
    const row = await this.prisma.banner.findUnique({
      where: { id },
      include: { media: { select: { id: true, url: true } } },
    });
    if (!row) throw new NotFoundException('Banner not found');
    return this.map(row);
  }

  async update(id: string, payload: BannerInput) {
    await this.findOne(id);
    const row = await this.prisma.banner.update({
      where: { id },
      data: {
        ...(payload.title !== undefined && { title: payload.title }),
        ...(payload.description !== undefined && { description: payload.description }),
        ...(payload.buttonText !== undefined && { buttonText: payload.buttonText }),
        ...(payload.buttonLink !== undefined && { buttonLink: payload.buttonLink }),
        ...(payload.mediaId !== undefined && { mediaId: payload.mediaId }),
      },
      include: { media: { select: { id: true, url: true } } },
    });
    return this.map(row);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.banner.delete({ where: { id } });
    return { id };
  }

  private map(row: {
    id: string;
    title: string;
    description: string | null;
    buttonText: string | null;
    buttonLink: string | null;
    mediaId: string | null;
    displayOrder: number;
    createdAt: Date;
    updatedAt: Date;
    media: { id: string; url: string } | null;
  }) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      buttonText: row.buttonText,
      buttonLink: row.buttonLink,
      mediaId: row.mediaId,
      mediaUrl: row.media?.url ?? null,
      displayOrder: row.displayOrder,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
