import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AdminGalleryController } from './admin-gallery.controller';
import { AdminGalleryService } from './admin-gallery.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminGalleryController],
  providers: [AdminGalleryService],
  exports: [AdminGalleryService],
})
export class AdminGalleryModule {}
