import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationHelper } from '../../../common/helpers/pagination.helper';
import { IPaginatedResponse } from '../../../common/types/pagination.types';
import { BrandAdminPayload, BrandRepository } from './brand.repository';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { BrandSwapDto } from './dto/brand-swap.dto';
import { GetBrandsQueryDto } from './dto/get-brands-query.dto';

export type BrandAdminResponse = {
  id: string;
  name: string;
  slug: string;
  status: BrandAdminPayload['status'];
  order: number;
  logoId: string | null;
  logoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class BrandAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly brandRepository: BrandRepository,
  ) {}

  async create(payload: CreateBrandDto): Promise<BrandAdminResponse> {
    const existing = await this.brandRepository.findBySlug(payload.slug);
    if (existing) {
      throw new ConflictException('A brand with this slug already exists');
    }

    return this.prisma.transaction(async (tx) => {
      const nextOrder = (await this.brandRepository.findMaxOrder(tx)) + 1;

      const created = await this.brandRepository.create(
        {
          name: payload.name,
          slug: payload.slug,
          status: payload.status,
          order: nextOrder,
          ...(typeof payload.logoId === 'string'
            ? { logoId: payload.logoId }
            : {}),
        },
        tx,
      );

      return this.mapBrand(created);
    });
  }

  async findAll(
    query: GetBrandsQueryDto,
  ): Promise<IPaginatedResponse<BrandAdminResponse>> {
    const { page, limit, search, status } = query;
    const offset = PaginationHelper.getOffset(page, limit);
    const where = this.brandRepository.buildListWhere(search, status);

    const [total, rows] = await Promise.all([
      this.brandRepository.count(where),
      this.brandRepository.findManyPaginated(where, offset, limit),
    ]);

    const data = rows.map((row) => this.mapBrand(row));
    return PaginationHelper.formatResponse(data, total, page, limit);
  }

  async findOne(brandId: string): Promise<BrandAdminResponse> {
    const brand = await this.brandRepository.findById(brandId);
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    return this.mapBrand(brand);
  }

  async update(
    brandId: string,
    payload: UpdateBrandDto,
  ): Promise<BrandAdminResponse> {
    return this.prisma.transaction(async (tx) => {
      const brand = await this.brandRepository.findById(brandId, tx);
      if (!brand) {
        throw new NotFoundException('Brand not found');
      }

      if (payload.slug !== undefined && payload.slug !== brand.slug) {
        const slugTaken = await this.brandRepository.findBySlugExcludingId(
          payload.slug,
          brandId,
          tx,
        );
        if (slugTaken) {
          throw new ConflictException(
            'A brand with this slug already exists',
          );
        }
      }

      const data: Prisma.BrandUpdateInput = {};

      if (payload.name !== undefined) {
        data.name = payload.name;
      }
      if (payload.slug !== undefined) {
        data.slug = payload.slug;
      }
      if (payload.status !== undefined) {
        data.status = payload.status;
      }
      if (payload.logoId !== undefined) {
        data.logo =
          payload.logoId === null
            ? { disconnect: true }
            : { connect: { id: payload.logoId } };
      }

      if (Object.keys(data).length === 0) {
        return this.mapBrand(brand);
      }

      const updated = await this.brandRepository.update(brandId, data, tx);
      return this.mapBrand(updated);
    });
  }

  async swapOrder(dto: BrandSwapDto) {
    return this.prisma.transaction(async (tx) => {
      const [a, b] = await Promise.all([
        this.brandRepository.findByIdForSwap(dto.id1, tx),
        this.brandRepository.findByIdForSwap(dto.id2, tx),
      ]);

      if (!a || !b) {
        throw new NotFoundException('One or both brands not found');
      }

      await this.brandRepository.swapOrder(a, b, tx);
    });
  }

  private mapBrand(row: BrandAdminPayload): BrandAdminResponse {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
      order: row.order,
      logoId: row.logoId,
      logoUrl: row.logo?.url ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
