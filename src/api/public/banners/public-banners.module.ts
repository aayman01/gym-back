import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { PublicBannersController } from './public-banners.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PublicBannersController],
})
export class PublicBannersModule {}
