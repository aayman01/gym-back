import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const optionalMediaId = z.union([z.string().uuid(), z.null()]).optional();

const optionalNullableString = (max: number) =>
  z.union([z.string().trim().max(max), z.null()]).optional();

export const updateSiteSettingsSchema = z
  .object({
    siteName: z.string().trim().min(1).max(255).optional(),
    siteUrl: optionalNullableString(500),
    metaTitle: optionalNullableString(255),
    metaDescription: optionalNullableString(5000),
    metaKeywords: optionalNullableString(2000),
    copyrightText: optionalNullableString(500),
    primaryColor: optionalNullableString(20),
    primaryHoverColor: optionalNullableString(20),
    currency: z.string().trim().length(3).optional(),
    description: optionalNullableString(5000),
    contactPhone: optionalNullableString(50),
    contactEmail: z.union([z.string().trim().email().max(255), z.null()]).optional(),
    contactAddress: optionalNullableString(2000),
    contactFormEnabled: z.boolean().optional(),
    headerLogoId: optionalMediaId,
    footerLogoId: optionalMediaId,
    emailLogoId: optionalMediaId,
    faviconId: optionalMediaId,
  })
  .strict();

export class UpdateSiteSettingsDto extends createZodDto(updateSiteSettingsSchema) {}
