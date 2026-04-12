import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { CategoryAdminController } from './category-admin.controller';
import { CategoryAdminService } from './category-admin.service';
import { CategoryRepository } from './category.repository';

@Module({
  imports: [PrismaModule],
  controllers: [CategoryAdminController],
  providers: [CategoryAdminService, CategoryRepository],
  exports: [CategoryAdminService, CategoryRepository],
})
export class CategoryAdminModule {}
