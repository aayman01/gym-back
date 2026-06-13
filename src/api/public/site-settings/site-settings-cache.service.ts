import { Injectable } from '@nestjs/common';

export type PublicSiteSettingsCachePayload = {
  siteName: string;
  siteUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  copyrightText: string | null;
  primaryColor: string | null;
  primaryHoverColor: string | null;
  headerLogoUrl: string | null;
  footerLogoUrl: string | null;
  emailLogoUrl: string | null;
  faviconUrl: string | null;
};

const TTL_MS = 60_000;

@Injectable()
export class SiteSettingsCacheService {
  private cached: PublicSiteSettingsCachePayload | null = null;
  private expiresAt = 0;

  get(): PublicSiteSettingsCachePayload | null {
    if (!this.cached || Date.now() > this.expiresAt) {
      return null;
    }
    return this.cached;
  }

  set(payload: PublicSiteSettingsCachePayload): void {
    this.cached = payload;
    this.expiresAt = Date.now() + TTL_MS;
  }

  invalidate(): void {
    this.cached = null;
    this.expiresAt = 0;
  }
}
