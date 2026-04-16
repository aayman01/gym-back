import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { CloudinaryModule } from '../../../modules/cloudinary/cloudinary.module';
import { AdminMediaController } from './admin-media.controller';
import { AdminMediaService } from './admin-media.service';
import { AdminMediaReserveService } from './admin-media-reserve.service';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  controllers: [AdminMediaController],
  providers: [AdminMediaService, AdminMediaReserveService],
  exports: [AdminMediaService, AdminMediaReserveService],
})
export class AdminMediaModule {}
