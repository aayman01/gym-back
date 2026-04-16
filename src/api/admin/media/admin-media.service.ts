import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { CloudinaryService } from '../../../modules/cloudinary/cloudinary.service';

const MAX_BYTES = 8 * 1024 * 1024;

@Injectable()
export class AdminMediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  private assertImage(file: {
    buffer: Buffer;
    mimetype: string;
    size: number;
    originalname?: string;
  }) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('File is required');
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException('File too large (max 8MB)');
    }
    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Only image uploads are allowed');
    }
  }

  async uploadForAdmin(
    adminId: string,
    file: {
      buffer: Buffer;
      mimetype: string;
      size: number;
      originalname?: string;
    },
  ) {
    this.assertImage(file);
    const id = randomUUID();
    const uploaded = await this.cloudinary.uploadImage(file.buffer, {
      publicIdPrefix: `admin-${adminId}-${id}`,
    });

    return this.prisma.adminMedia.create({
      data: {
        id,
        url: uploaded.secure_url,
        key: uploaded.public_id,
        mimeType: uploaded.resource_type === 'image' ? `image/${uploaded.format}` : file.mimetype,
        size: uploaded.bytes ?? file.size,
        provider: 'cloudinary',
        format: uploaded.format ?? null,
        width: uploaded.width ?? null,
        height: uploaded.height ?? null,
        resourceType: uploaded.resource_type ?? 'image',
        uploadedByAdminId: adminId,
      },
    });
  }
}
