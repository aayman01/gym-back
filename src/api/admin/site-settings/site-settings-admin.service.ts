import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { SiteSettingsCacheService } from '../../public/site-settings/site-settings-cache.service';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';
import {
  SiteSettingsPayload,
  SiteSettingsRepository,
} from './site-settings.repository';

export type SiteSettingsAdminResponse = {
  id: string;
  siteName: string;
  siteUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  copyrightText: string | null;
  primaryColor: string | null;
  primaryHoverColor: string | null;
  currency: string;
  description: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactAddress: string | null;
  contactFormEnabled: boolean;
  headerLogoId: string | null;
  headerLogoUrl: string | null;
  footerLogoId: string | null;
  footerLogoUrl: string | null;
  emailLogoId: string | null;
  emailLogoUrl: string | null;
  faviconId: string | null;
  faviconUrl: string | null;
  updatedAt: Date;
};

@Injectable()
export class SiteSettingsAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly siteSettingsRepository: SiteSettingsRepository,
    private readonly siteSettingsCache: SiteSettingsCacheService,
  ) {}

  async getOrCreate(): Promise<SiteSettingsAdminResponse> {
    let row = await this.siteSettingsRepository.findActive();
    if (!row) {
      row = await this.siteSettingsRepository.createDefault();
    }
    return this.mapRow(row);
  }

  async update(payload: UpdateSiteSettingsDto): Promise<SiteSettingsAdminResponse> {
    return this.prisma.transaction(async (tx) => {
      let row = await this.siteSettingsRepository.findActive(tx);
      if (!row) {
        row = await this.siteSettingsRepository.createDefault(tx);
      }

      const data: Prisma.StoreConfigUpdateInput = {};

      if (payload.siteName !== undefined) {
        data.brandName = payload.siteName;
      }
      if (payload.siteUrl !== undefined) {
        data.siteUrl = payload.siteUrl;
      }
      if (payload.metaTitle !== undefined) {
        data.metaTitle = payload.metaTitle;
      }
      if (payload.metaDescription !== undefined) {
        data.metaDescription = payload.metaDescription;
      }
      if (payload.metaKeywords !== undefined) {
        data.metaKeywords = payload.metaKeywords;
      }
      if (payload.copyrightText !== undefined) {
        data.copyrightText = payload.copyrightText;
      }
      if (payload.primaryColor !== undefined) {
        data.primaryColor = payload.primaryColor;
      }
      if (payload.primaryHoverColor !== undefined) {
        data.primaryHoverColor = payload.primaryHoverColor;
      }
      if (payload.currency !== undefined) {
        data.currency = payload.currency;
      }
      if (payload.description !== undefined) {
        data.description = payload.description;
      }
      if (payload.contactPhone !== undefined) {
        data.contactPhone = payload.contactPhone;
      }
      if (payload.contactEmail !== undefined) {
        data.contactEmail = payload.contactEmail;
      }
      if (payload.contactAddress !== undefined) {
        data.contactAddress = payload.contactAddress;
      }
      if (payload.contactFormEnabled !== undefined) {
        data.contactFormEnabled = payload.contactFormEnabled;
      }

      this.applyMediaRelation(data, 'headerLogo', payload.headerLogoId);
      this.applyMediaRelation(data, 'footerLogo', payload.footerLogoId);
      this.applyMediaRelation(data, 'emailLogo', payload.emailLogoId);
      this.applyMediaRelation(data, 'favicon', payload.faviconId);

      if (Object.keys(data).length === 0) {
        return this.mapRow(row);
      }

      const updated = await this.siteSettingsRepository.update(row.id, data, tx);
      this.siteSettingsCache.invalidate();
      return this.mapRow(updated);
    });
  }

  private applyMediaRelation(
    data: Prisma.StoreConfigUpdateInput,
    field: 'headerLogo' | 'footerLogo' | 'emailLogo' | 'favicon',
    mediaId: string | null | undefined,
  ) {
    if (mediaId === undefined) return;
    data[field] =
      mediaId === null ? { disconnect: true } : { connect: { id: mediaId } };
  }

  private mapRow(row: SiteSettingsPayload): SiteSettingsAdminResponse {
    return {
      id: row.id,
      siteName: row.brandName,
      siteUrl: row.siteUrl,
      metaTitle: row.metaTitle,
      metaDescription: row.metaDescription,
      metaKeywords: row.metaKeywords,
      copyrightText: row.copyrightText,
      primaryColor: row.primaryColor,
      primaryHoverColor: row.primaryHoverColor,
      currency: row.currency,
      description: row.description,
      contactPhone: row.contactPhone,
      contactEmail: row.contactEmail,
      contactAddress: row.contactAddress,
      contactFormEnabled: row.contactFormEnabled,
      headerLogoId: row.headerLogoId,
      headerLogoUrl: row.headerLogo?.url ?? null,
      footerLogoId: row.footerLogoId,
      footerLogoUrl: row.footerLogo?.url ?? null,
      emailLogoId: row.emailLogoId,
      emailLogoUrl: row.emailLogo?.url ?? null,
      faviconId: row.faviconId,
      faviconUrl: row.favicon?.url ?? null,
      updatedAt: row.updatedAt,
    };
  }
}
