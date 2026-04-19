import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationHelper } from '@common/helpers/pagination.helper';
import { IPaginatedResponse } from '@common/types/pagination.types';
import { PaginatedSearchQueryDto } from '@common/dto/paginated-search-query.dto';
import {
  ProductAttributeListPayload,
  ProductAttributeRepository,
} from './product-attribute.repository';
import { CreateProductAttributeDto } from './dto/create-product-attribute.dto';
import { UpdateProductAttributeDto } from './dto/update-product-attribute.dto';
import { AttributeSwapDto } from './dto/attribute-swap.dto';

export type ProductAttributeAdminListItem = {
  id: string;
  name: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  optionsCount: number;
  options: string[];
};

export type ProductAttributeAdminDetail = {
  id: string;
  name: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  options: { id: string; value: string; order: number }[];
};

@Injectable()
export class ProductAttributeAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productAttributeRepository: ProductAttributeRepository,
  ) {}

  async create(payload: CreateProductAttributeDto) {
    return this.prisma.transaction(async (tx) => {
      const nextOrder =
        (await this.productAttributeRepository.findMaxOrder(tx)) + 1;

      const attr = await this.productAttributeRepository.createAttribute(
        { name: payload.name, order: nextOrder },
        tx,
      );

      if (payload.options?.length) {
        await this.productAttributeRepository.createManyOptions(
          payload.options.map((o, i) => ({
            attributeId: attr.id,
            value: o.value,
            order: i,
          })),
          tx,
        );
      }

      return { id: attr.id, name: attr.name };
    });
  }

  async findAll(
    query: PaginatedSearchQueryDto,
  ): Promise<IPaginatedResponse<ProductAttributeAdminListItem>> {
    const { page, limit, search } = query;
    const offset = PaginationHelper.getOffset(page, limit);
    const where = this.productAttributeRepository.buildListWhere(search);

    const [total, rows] = await Promise.all([
      this.productAttributeRepository.count(where),
      this.productAttributeRepository.findManyPaginated(where, offset, limit),
    ]);

    const data = rows.map((row) => this.mapListRow(row));
    return PaginationHelper.formatResponse(data, total, page, limit);
  }

  async findOne(attributeId: string): Promise<ProductAttributeAdminDetail> {
    const attribute =
      await this.productAttributeRepository.findByIdWithOptions(attributeId);

    if (!attribute) {
      throw new NotFoundException('Attribute not found');
    }

    return this.mapDetail(attribute);
  }

  async update(attributeId: string, payload: UpdateProductAttributeDto) {
    return this.prisma.transaction(async (tx) => {
      const attribute =
        await this.productAttributeRepository.findByIdWithOptions(
          attributeId,
          tx,
        );

      if (!attribute) {
        throw new NotFoundException('Attribute not found');
      }

      if (payload.name !== undefined) {
        await this.productAttributeRepository.updateName(
          attributeId,
          payload.name,
          tx,
        );
      }

      if (payload.options?.length) {
        const existing =
          await this.productAttributeRepository.findOptionsByAttributeId(
            attributeId,
            tx,
          );
        const existingByValue = new Map(existing.map((o) => [o.value, o]));

        let nextOrder =
          (await this.productAttributeRepository.findMaxOptionOrder(
            attributeId,
            tx,
          )) + 1;

        const newRows: {
          attributeId: string;
          value: string;
          order: number;
        }[] = [];

        for (const opt of payload.options) {
          if (!existingByValue.has(opt.value)) {
            newRows.push({
              attributeId,
              value: opt.value,
              order: nextOrder++,
            });
          }
        }

        if (newRows.length > 0) {
          await this.productAttributeRepository.createManyOptions(newRows, tx);
        }
      }

      return { id: attributeId };
    });
  }

  async delete(attributeId: string) {
    const attribute =
      await this.productAttributeRepository.findById(attributeId);
    if (!attribute) {
      throw new NotFoundException('Attribute not found');
    }

    await this.productAttributeRepository.delete(attributeId);
    return { id: attributeId };
  }

  async swapAttributes(dto: AttributeSwapDto) {
    return this.prisma.transaction(async (tx) => {
      const [a, b] = await Promise.all([
        this.productAttributeRepository.findById(dto.id1, tx),
        this.productAttributeRepository.findById(dto.id2, tx),
      ]);

      if (!a || !b) {
        throw new NotFoundException('One or both attributes not found');
      }

      await this.productAttributeRepository.swapAttributeOrder(a, b, tx);
    });
  }

  async swapOptions(attributeId: string, dto: AttributeSwapDto) {
    return this.prisma.transaction(async (tx) => {
      const attribute = await this.productAttributeRepository.findById(
        attributeId,
        tx,
      );
      if (!attribute) {
        throw new NotFoundException('Attribute not found');
      }

      const optionRows = await this.productAttributeRepository.findOptionsByIds(
        [dto.id1, dto.id2],
        tx,
      );

      if (optionRows.length !== 2) {
        throw new NotFoundException('One or both options not found');
      }

      const o1 = optionRows.find((o) => o.id === dto.id1)!;
      const o2 = optionRows.find((o) => o.id === dto.id2)!;

      if (o1.attributeId !== attributeId || o2.attributeId !== attributeId) {
        throw new NotFoundException('One or both options not found');
      }

      await this.productAttributeRepository.swapOptionOrder(o1, o2, tx);
    });
  }

  private mapListRow(
    row: ProductAttributeListPayload,
  ): ProductAttributeAdminListItem {
    return {
      id: row.id,
      name: row.name,
      order: row.order,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      optionsCount: row._count.options,
      options: row.options.map((o) => o.value),
    };
  }

  private mapDetail(
    attribute: NonNullable<
      Awaited<ReturnType<ProductAttributeRepository['findByIdWithOptions']>>
    >,
  ): ProductAttributeAdminDetail {
    return {
      id: attribute.id,
      name: attribute.name,
      order: attribute.order,
      createdAt: attribute.createdAt,
      updatedAt: attribute.updatedAt,
      options: attribute.options.map((o) => ({
        id: o.id,
        value: o.value,
        order: o.order,
      })),
    };
  }
}
