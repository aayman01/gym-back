import { Prisma } from '@prisma/client';

export type TPrismaLockTransaction = {
    lock?: boolean;
    tx: Prisma.TransactionClient;
};
