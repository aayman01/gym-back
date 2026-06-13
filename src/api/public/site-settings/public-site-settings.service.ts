import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  PublicSiteSettingsCachePayload,
  SiteSettingsCacheService,
} from './site-settings-cache.service';

@Injectable()
export class PublicSiteSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly siteSettingsCache: SiteSettingsCacheService,
  ) {}

  async getPublicSettings(): Promise<PublicSiteSettingsCachePayload> {
    const cached = this.siteSettingsCache.get();
    if (cached) {
      return cached;
    }

    const row = await this.prisma.storeConfig.findFirst({
      where: { deletedAt: null },
      select: {
        brandName: true,
        siteUrl: true,
        metaTitle: true,
        metaDescription: true,
        metaKeywords: true,
        copyrightText: true,
        primaryColor: true,
        primaryHoverColor: true,
        headerLogo: { select: { url: true } },
        footerLogo: { select: { url: true } },
        emailLogo: { select: { url: true } },
        favicon: { select: { url: true } },
      },
    });

    const payload: PublicSiteSettingsCachePayload = {
      siteName: row?.brandName ?? 'Crimson Forge',
      siteUrl: row?.siteUrl ?? null,
      metaTitle: row?.metaTitle ?? null,
      metaDescription: row?.metaDescription ?? null,
      metaKeywords: row?.metaKeywords ?? null,
      copyrightText: row?.copyrightText ?? null,
      primaryColor: row?.primaryColor ?? null,
      primaryHoverColor: row?.primaryHoverColor ?? null,
      headerLogoUrl: row?.headerLogo?.url ?? null,
      footerLogoUrl: row?.footerLogo?.url ?? null,
      emailLogoUrl: row?.emailLogo?.url ?? null,
      faviconUrl: row?.favicon?.url ?? null,
    };

    this.siteSettingsCache.set(payload);
    return payload;
  }
}
