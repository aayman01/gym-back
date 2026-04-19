import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationHelper } from '../../../common/helpers/pagination.helper';
import { IPaginatedResponse } from '../../../common/types/pagination.types';
import { PaginatedSearchQueryDto } from '../../../common/dto/paginated-search-query.dto';
import {
  CategoryAdminPayload,
  CategoryRepository,
} from './category.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategorySwapDto } from './dto/category-swap.dto';

export type CategoryAdminResponse = {
  id: string;
  name: string;
  slug: string;
  status: CategoryAdminPayload['status'];
  isFeature: boolean;
  order: number;
  imageId: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class CategoryAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async create(payload: CreateCategoryDto): Promise<CategoryAdminResponse> {
    const existing = await this.categoryRepository.findBySlug(payload.slug);
    if (existing) {
      throw new ConflictException('A category with this slug already exists');
    }

    return this.prisma.transaction(async (tx) => {
      const nextOrder = (await this.categoryRepository.findMaxOrder(tx)) + 1;

      const order = payload.order ?? nextOrder;

      const created = await this.categoryRepository.create(
        {
          name: payload.name,
          slug: payload.slug,
          status: payload.status,
          isFeature: payload.isFeature,
          order,
          ...(payload.imageId ? { imageId: payload.imageId } : {}),
        },
        tx,
      );

      return this.mapCategory(created);
    });
  }

  async findAll(
    query: PaginatedSearchQueryDto,
  ): Promise<IPaginatedResponse<CategoryAdminResponse>> {
    const { page, limit, search } = query;
    const offset = PaginationHelper.getOffset(page, limit);
    const where = this.categoryRepository.buildListWhere(search);

    const [total, rows] = await Promise.all([
      this.categoryRepository.count(where),
      this.categoryRepository.findManyPaginated(where, offset, limit),
    ]);

    const data = rows.map((row) => this.mapCategory(row));
    return PaginationHelper.formatResponse(data, total, page, limit);
  }

  async findOne(categoryId: string): Promise<CategoryAdminResponse> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return this.mapCategory(category);
  }

  async update(
    categoryId: string,
    payload: UpdateCategoryDto,
  ): Promise<CategoryAdminResponse> {
    const existing = await this.categoryRepository.findById(categoryId);
    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    if (payload.slug !== undefined) {
      const slugTaken = await this.categoryRepository.findBySlugExcludingId(
        payload.slug,
        categoryId,
      );
      if (slugTaken) {
        throw new ConflictException('A category with this slug already exists');
      }
    }

    return this.prisma.transaction(async (tx) => {
      const data: Prisma.CategoryUpdateInput = {};

      if (payload.name !== undefined) {
        data.name = payload.name;
      }
      if (payload.slug !== undefined) {
        data.slug = payload.slug;
      }
      if (payload.status !== undefined) {
        data.status = payload.status;
      }
      if (payload.isFeature !== undefined) {
        data.isFeature = payload.isFeature;
      }
      if (payload.order !== undefined) {
        data.order = payload.order;
      }
      if (payload.imageId !== undefined) {
        data.image =
          payload.imageId === null
            ? { disconnect: true }
            : { connect: { id: payload.imageId } };
      }

      const updated = await this.categoryRepository.update(
        categoryId,
        data,
        tx,
      );
      return this.mapCategory(updated);
    });
  }

  async delete(categoryId: string) {
    const existing = await this.categoryRepository.findById(categoryId);
    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    await this.categoryRepository.softDelete(categoryId);
    return { id: categoryId };
  }

  async swapOrder(dto: CategorySwapDto) {
    return this.prisma.transaction(async (tx) => {
      const [a, b] = await Promise.all([
        this.categoryRepository.findByIdForSwap(dto.id1, tx),
        this.categoryRepository.findByIdForSwap(dto.id2, tx),
      ]);

      if (!a || !b) {
        throw new NotFoundException('One or both categories not found');
      }

      await this.categoryRepository.swapOrder(a, b, tx);
    });
  }

  private mapCategory(row: CategoryAdminPayload): CategoryAdminResponse {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
      isFeature: row.isFeature,
      order: row.order,
      imageId: row.imageId,
      imageUrl: row.image?.url ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
