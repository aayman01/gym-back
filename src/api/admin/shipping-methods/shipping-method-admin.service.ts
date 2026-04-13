import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationHelper } from '../../../common/helpers/pagination.helper';
import { IPaginatedResponse } from '../../../common/types/pagination.types';
import {
  ShippingMethodRepository,
  ShippingMethodAdminRow,
} from './shipping-method.repository';
import { CreateShippingMethodDto } from './dto/create-shipping-method.dto';
import { UpdateShippingMethodDto } from './dto/update-shipping-method.dto';
import { GetShippingMethodsQueryDto } from './dto/get-shipping-methods-query.dto';

export type ShippingMethodAdminResponse = {
  id: string;
  name: string;
  price: string;
  isActive: boolean;
  deliveryDays: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class ShippingMethodAdminService {
  constructor(
    private readonly shippingMethodRepository: ShippingMethodRepository,
  ) {}

  async create(
    dto: CreateShippingMethodDto,
  ): Promise<ShippingMethodAdminResponse> {
    const created = await this.shippingMethodRepository.create({
      name: dto.name,
      price: new Prisma.Decimal(dto.price),
      deliveryDays: dto.deliveryDays,
      isActive: dto.isActive ?? true,
    });
    return this.mapRow(created);
  }

  async findAll(
    query: GetShippingMethodsQueryDto,
  ): Promise<IPaginatedResponse<ShippingMethodAdminResponse>> {
    const { page, limit, search, isActive } = query;
    const offset = PaginationHelper.getOffset(page, limit);
    const where = this.shippingMethodRepository.buildListWhere(
      search,
      isActive,
    );

    const [total, rows] = await Promise.all([
      this.shippingMethodRepository.count(where),
      this.shippingMethodRepository.findManyPaginated(
        where,
        offset,
        limit,
      ),
    ]);

    const data = rows.map((row) => this.mapRow(row));
    return PaginationHelper.formatResponse(data, total, page, limit);
  }

  async findOne(id: string): Promise<ShippingMethodAdminResponse> {
    const row = await this.shippingMethodRepository.findById(id);
    if (!row) {
      throw new NotFoundException('Shipping method not found');
    }
    return this.mapRow(row);
  }

  async update(
    id: string,
    dto: UpdateShippingMethodDto,
  ): Promise<ShippingMethodAdminResponse> {
    await this.findOne(id);

    const data: Prisma.ShippingMethodUpdateInput = {};
    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    if (dto.price !== undefined) {
      data.price = new Prisma.Decimal(dto.price);
    }
    if (dto.deliveryDays !== undefined) {
      data.deliveryDays = dto.deliveryDays;
    }
    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    const updated = await this.shippingMethodRepository.update(id, data);
    return this.mapRow(updated);
  }

  async remove(id: string): Promise<ShippingMethodAdminResponse> {
    await this.findOne(id);
    const removed = await this.shippingMethodRepository.delete(id);
    return this.mapRow(removed);
  }

  async activate(id: string): Promise<ShippingMethodAdminResponse> {
    await this.findOne(id);
    const updated = await this.shippingMethodRepository.update(id, {
      isActive: true,
    });
    return this.mapRow(updated);
  }

  async deactivate(id: string): Promise<ShippingMethodAdminResponse> {
    await this.findOne(id);
    const updated = await this.shippingMethodRepository.update(id, {
      isActive: false,
    });
    return this.mapRow(updated);
  }

  private mapRow(row: ShippingMethodAdminRow): ShippingMethodAdminResponse {
    return {
      id: row.id,
      name: row.name,
      price: row.price.toString(),
      isActive: row.isActive,
      deliveryDays: row.deliveryDays,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
