import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { UserAuthModule } from '../auth/user-auth.module';
import { UserReturnsController } from './user-returns.controller';
import { UserReturnsService } from './user-returns.service';

@Module({
  imports: [PrismaModule, UserAuthModule],
  controllers: [UserReturnsController],
  providers: [UserReturnsService],
})
export class UserReturnsModule {}
