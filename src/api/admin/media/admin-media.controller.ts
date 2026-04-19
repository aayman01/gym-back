import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { sendResponse } from '@common/helpers/send.response';
import { CurrentAdmin } from '@common/decorators/current-admin.decorator';
import type { AdminSessionData } from '../auth/types/admin-session.types';
import { AdminMediaService } from './admin-media.service';

@Controller('admin/media')
export class AdminMediaController {
  constructor(private readonly mediaService: AdminMediaService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype?.startsWith('image/')) {
          callback(new BadRequestException('Only image files are allowed'), false);
          return;
        }
        callback(null, true);
      },
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  async upload(
    @CurrentAdmin() admin: AdminSessionData,
    @UploadedFile() file: { buffer: Buffer; mimetype: string; size: number },
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const data = await this.mediaService.uploadForAdmin(admin.id, file);
    return sendResponse({
      success: true,
      message: 'Media uploaded successfully',
      data,
    });
  }
}
