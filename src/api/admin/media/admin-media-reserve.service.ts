import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';

export type PrismaTx = Prisma.TransactionClient;

@Injectable()
export class AdminMediaReserveService {
  /**
   * Accepts gallery media or a fresh upload created by the same admin.
   * Must run inside a Prisma transaction when used with product writes.
   */
  async validateAndReserveFromFreshOrGallery(
    adminId: string,
    mediaId: string,
    tx: PrismaTx,
  ) {
    const inGallery = await tx.adminGalleryItem.findUnique({
      where: { mediaId },
    });

    const media = await tx.adminMedia.findUnique({ where: { id: mediaId } });
    if (!media) {
      throw new NotFoundException(`Media with ID ${mediaId} not found`);
    }
    if (!media.mimeType.startsWith('image/')) {
      throw new BadRequestException('Only images are allowed');
    }

    if (inGallery) {
      return media;
    }

    if (media.uploadedByAdminId !== adminId) {
      throw new BadRequestException(
        `Media ${mediaId} is not in the gallery and was not uploaded by this admin`,
      );
    }

    return media;
  }

  /**
   * Batch reserve. Gallery IDs may repeat across variants; fresh uploads must be unique in the payload.
   */
  async validateAndReserveManyFromFreshOrGallery(
    adminId: string,
    mediaIds: string[],
    tx: PrismaTx,
  ) {
    if (mediaIds.length === 0) return [];

    const uniqueIds = [...new Set(mediaIds)];
    const inGalleryRows = await tx.adminGalleryItem.findMany({
      where: { mediaId: { in: uniqueIds } },
      select: { mediaId: true },
    });
    const inGallerySet = new Set(inGalleryRows.map((r) => r.mediaId));

    const galleryGroup: string[] = [];
    const freshGroup: string[] = [];
    for (const id of mediaIds) {
      if (inGallerySet.has(id)) galleryGroup.push(id);
      else freshGroup.push(id);
    }

    const uniqueFresh = [...new Set(freshGroup)];
    if (uniqueFresh.length !== freshGroup.length) {
      throw new BadRequestException(
        'Freshly uploaded images cannot be used multiple times in the same request',
      );
    }

    const resultsMap = new Map<string, Awaited<ReturnType<typeof this.validateAndReserveFromFreshOrGallery>>>();

    for (const id of uniqueIds) {
      const m = await this.validateAndReserveFromFreshOrGallery(adminId, id, tx);
      resultsMap.set(id, m);
    }

    return mediaIds.map((id) => resultsMap.get(id)!);
  }
}
