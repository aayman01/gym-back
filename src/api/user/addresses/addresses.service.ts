import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(customerId: string) {
    return this.prisma.customerAddress.findMany({
      where: { customerId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async create(customerId: string, dto: CreateAddressDto) {
    if (dto.isDefault) {
      await this.prisma.customerAddress.updateMany({
        where: { customerId },
        data: { isDefault: false },
      });
    }

    return this.prisma.customerAddress.create({
      data: {
        customerId,
        label: dto.label ?? null,
        isDefault: dto.isDefault ?? false,
        recipientName: dto.recipientName,
        phone: dto.phone,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2 ?? null,
        city: dto.city,
        stateOrDivision: dto.stateOrDivision,
        postalCode: dto.postalCode ?? null,
        country: dto.country,
      },
    });
  }

  async update(customerId: string, addressId: string, dto: UpdateAddressDto) {
    const address = await this.prisma.customerAddress.findFirst({
      where: { id: addressId, customerId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (dto.isDefault) {
      await this.prisma.customerAddress.updateMany({
        where: { customerId, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    return this.prisma.customerAddress.update({
      where: { id: addressId },
      data: {
        ...(dto.label !== undefined && { label: dto.label }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        ...(dto.recipientName !== undefined && {
          recipientName: dto.recipientName,
        }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.addressLine1 !== undefined && {
          addressLine1: dto.addressLine1,
        }),
        ...(dto.addressLine2 !== undefined && {
          addressLine2: dto.addressLine2,
        }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.stateOrDivision !== undefined && {
          stateOrDivision: dto.stateOrDivision,
        }),
        ...(dto.postalCode !== undefined && { postalCode: dto.postalCode }),
        ...(dto.country !== undefined && { country: dto.country }),
      },
    });
  }

  async remove(customerId: string, addressId: string) {
    const address = await this.prisma.customerAddress.findFirst({
      where: { id: addressId, customerId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.prisma.customerAddress.delete({ where: { id: addressId } });
    return { deleted: true };
  }

  async setDefault(customerId: string, addressId: string) {
    const address = await this.prisma.customerAddress.findFirst({
      where: { id: addressId, customerId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.prisma.customerAddress.updateMany({
      where: { customerId },
      data: { isDefault: false },
    });

    return this.prisma.customerAddress.update({
      where: { id: addressId },
      data: { isDefault: true },
    });
  }
}
