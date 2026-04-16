import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';
import type { AppEnv } from 'src/config/env.schema';

@Injectable()
export class CloudinaryService {
  private readonly folder: string;

  constructor(private readonly config: ConfigService<AppEnv, true>) {
    cloudinary.config({
      cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME', { infer: true }),
      api_key: this.config.get('CLOUDINARY_API_KEY', { infer: true }),
      api_secret: this.config.get('CLOUDINARY_API_SECRET', { infer: true }),
      secure: true,
    });
    this.folder = this.config.get('CLOUDINARY_UPLOAD_FOLDER', { infer: true });
  }

  async uploadImage(
    buffer: Buffer,
    options?: { publicIdPrefix?: string },
  ): Promise<UploadApiResponse> {
    const publicIdPrefix = options?.publicIdPrefix?.trim();
    const publicId = publicIdPrefix
      ? `${publicIdPrefix}-${Date.now()}`
      : undefined;

    return new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: this.folder,
          resource_type: 'image',
          public_id: publicId,
          use_filename: false,
          unique_filename: true,
          overwrite: false,
        },
        (error, result) => {
          if (error || !result) {
            reject(
              new InternalServerErrorException(
                error?.message || 'Cloudinary upload failed',
              ),
            );
            return;
          }
          resolve(result);
        },
      );
      stream.end(buffer);
    });
  }
}
