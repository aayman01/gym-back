import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TaxType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationHelper } from '../../../common/helpers/pagination.helper';
import { IPaginatedResponse } from '../../../common/types/pagination.types';
import { TaxRepository, TaxAdminRow } from './tax.repository';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';
import { GetTaxesQueryDto } from './dto/get-taxes-query.dto';

export type TaxAdminResponse = {
  id: string;
  name: string;
  rate: string;
  type: TaxType;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class TaxAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taxRepository: TaxRepository,
  ) {}

  async create(dto: CreateTaxDto): Promise<TaxAdminResponse> {
    if (!dto.isActive && dto.isDefault) {
      throw new BadRequestException('Inactive tax cannot be default');
    }

    return this.prisma.transaction(async (tx) => {
      if (dto.isDefault) {
        await this.taxRepository.resetDefaultTax(tx);
      }

      const created = await this.taxRepository.create(
        {
          name: dto.name,
          rate: new Prisma.Decimal(dto.rate),
          type: dto.type,
          isDefault: dto.isDefault ?? false,
          isActive: dto.isActive ?? true,
        },
        tx,
      );

      return this.mapTax(created);
    });
  }

  async findAll(
    query: GetTaxesQueryDto,
  ): Promise<IPaginatedResponse<TaxAdminResponse>> {
    const { page, limit, search, isActive } = query;
    const offset = PaginationHelper.getOffset(page, limit);
    const where = this.taxRepository.buildListWhere(search, isActive);

    const [total, rows] = await Promise.all([
      this.taxRepository.count(where),
      this.taxRepository.findManyPaginated(where, offset, limit),
    ]);

    const data = rows.map((row) => this.mapTax(row));
    return PaginationHelper.formatResponse(data, total, page, limit);
  }

  async findOne(taxId: string): Promise<TaxAdminResponse> {
    const tax = await this.taxRepository.findById(taxId);
    if (!tax) {
      throw new NotFoundException('Tax not found');
    }
    return this.mapTax(tax);
  }

  async update(
    taxId: string,
    dto: UpdateTaxDto,
  ): Promise<TaxAdminResponse> {
    await this.findOne(taxId);

    const data: Prisma.TaxUpdateInput = {};
    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    if (dto.rate !== undefined) {
      data.rate = new Prisma.Decimal(dto.rate);
    }
    if (dto.type !== undefined) {
      data.type = dto.type;
    }

    const updated = await this.taxRepository.update(taxId, data);
    return this.mapTax(updated);
  }

  async remove(taxId: string): Promise<TaxAdminResponse> {
    const tax = await this.taxRepository.findById(taxId);
    if (!tax) {
      throw new NotFoundException('Tax not found');
    }

    if (tax.isDefault) {
      throw new BadRequestException(
        'Cannot delete the default tax. Please unset it as default first.',
      );
    }

    const deleted = await this.taxRepository.softDelete(taxId);
    return this.mapTax(deleted);
  }

  async setDefault(taxId: string): Promise<TaxAdminResponse> {
    const tax = await this.taxRepository.findById(taxId);
    if (!tax) {
      throw new NotFoundException('Tax not found');
    }

    if (!tax.isActive) {
      throw new BadRequestException('Inactive tax cannot be set as default');
    }

    return this.prisma.transaction(async (tx) => {
      await this.taxRepository.resetDefaultTax(tx);
      const updated = await this.taxRepository.update(
        taxId,
        { isDefault: true },
        tx,
      );
      return this.mapTax(updated);
    });
  }

  async unsetDefault(taxId: string): Promise<TaxAdminResponse> {
    const tax = await this.taxRepository.findById(taxId);
    if (!tax) {
      throw new NotFoundException('Tax not found');
    }

    if (!tax.isDefault) {
      throw new BadRequestException('Tax is not the default');
    }

    const updated = await this.taxRepository.update(taxId, {
      isDefault: false,
    });
    return this.mapTax(updated);
  }

  async getDefault(): Promise<TaxAdminResponse> {
    const tax = await this.taxRepository.findDefaultTax();
    if (!tax) {
      throw new NotFoundException('No default tax found');
    }
    return this.mapTax(tax);
  }

  async activate(taxId: string): Promise<TaxAdminResponse> {
    await this.findOne(taxId);
    const updated = await this.taxRepository.update(taxId, {
      isActive: true,
    });
    return this.mapTax(updated);
  }

  async deactivate(taxId: string): Promise<TaxAdminResponse> {
    const tax = await this.taxRepository.findById(taxId);
    if (!tax) {
      throw new NotFoundException('Tax not found');
    }

    if (tax.isDefault) {
      throw new BadRequestException(
        'Cannot deactivate the default tax. Please unset it as default or set another tax as default first.',
      );
    }

    const updated = await this.taxRepository.update(taxId, {
      isActive: false,
    });
    return this.mapTax(updated);
  }

  private mapTax(row: TaxAdminRow): TaxAdminResponse {
    return {
      id: row.id,
      name: row.name,
      rate: row.rate.toString(),
      type: row.type,
      isDefault: row.isDefault,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
