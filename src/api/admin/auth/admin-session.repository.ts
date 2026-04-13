import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AdminSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma;
  }

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  create(adminId: string, expiresAt: Date, tx?: Prisma.TransactionClient) {
    const token = this.generateToken();
    return this.client(tx).adminSession.create({
      data: {
        adminId,
        token,
        expiresAt,
      },
    });
  }

  findById(id: string, tx?: Prisma.TransactionClient) {
    return this.client(tx).adminSession.findUnique({
      where: { id },
    });
  }

  deleteByToken(token: string, tx?: Prisma.TransactionClient) {
    return this.client(tx).adminSession.deleteMany({
      where: { token },
    });
  }
}
