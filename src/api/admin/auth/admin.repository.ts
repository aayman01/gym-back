import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma;
  }

  findByEmail(email: string, tx?: Prisma.TransactionClient) {
    return this.client(tx).admin.findUnique({
      where: { email },
    });
  }

  findById(id: string, tx?: Prisma.TransactionClient) {
    return this.client(tx).admin.findUnique({
      where: { id },
    });
  }

  create(
    data: Prisma.AdminCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    return this.client(tx).admin.create({ data });
  }
}
