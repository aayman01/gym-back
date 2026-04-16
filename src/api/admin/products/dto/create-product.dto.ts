import { createZodDto } from 'nestjs-zod';
import { ItemStatus, ProductType, SellingUnit } from '@prisma/client';
import { z } from 'zod';

const slugSchema = z
  .string()
  .trim()
  .min(1, 'Slug is required')
  .max(255)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/i,
    'Slug must be URL-safe (letters, numbers, hyphens)',
  );

export const createProductSchema = z
  .object({
    thumbnailId: z.string().uuid().optional().nullable(),
    brandId: z.string().uuid().optional().nullable(),
    primaryCategoryId: z.string().uuid('Invalid primary category ID'),
    secondaryCategoryIds: z
      .array(z.string().uuid('Invalid secondary category ID'))
      .optional()
      .refine(
        (ids) => {
          if (!ids?.length) return true;
          return new Set(ids).size === ids.length;
        },
        { message: 'Duplicate secondary category IDs are not allowed' },
      ),
    slug: slugSchema,
    status: z.nativeEnum(ItemStatus).optional().default(ItemStatus.ACTIVE),
    basePrice: z.number().min(0).default(0),
    type: z.nativeEnum(ProductType).optional().default(ProductType.PHYSICAL),
    isFeature: z.boolean().optional().default(false),
    sellingUnit: z.nativeEnum(SellingUnit).optional().default(SellingUnit.PIECE),
    lowStockThreshold: z.number().int().min(0).optional().default(0),
    tags: z
      .array(z.string().trim().min(1).max(30))
      .optional()
      .default([])
      .refine((tags) => new Set(tags).size === tags.length, {
        message: 'Tags must be unique',
      }),
    title: z.string().trim().min(1).max(255),
    summary: z.string().max(500).optional().nullable(),
    description: z.string().max(10000).optional().nullable(),
    metaTitle: z.string().max(255).optional().nullable(),
    metaKeywords: z.string().max(255).optional().nullable(),
    metaDescription: z.string().max(1000).optional().nullable(),
    shippingMethodId: z.string().uuid().optional().nullable(),
    taxId: z.string().uuid().optional().nullable(),
    isTaxIncluded: z.boolean().optional().default(false),
    isFragile: z.boolean().optional().default(false),
    isPerishable: z.boolean().optional().default(false),

    productGalleryImageIds: z.array(z.string().uuid()).optional(),

    attributes: z
      .array(
        z.object({
          attributeId: z.string().uuid(),
          optionIds: z
            .array(z.string().uuid())
            .min(1)
            .refine((ids) => new Set(ids).size === ids.length, {
              message: 'Duplicate option IDs are not allowed',
            }),
        }),
      )
      .optional()
      .refine(
        (attrs) => {
          if (!attrs) return true;
          return new Set(attrs.map((a) => a.attributeId)).size === attrs.length;
        },
        { message: 'Duplicate attribute IDs are not allowed' },
      ),

    variants: z
      .array(
        z.object({
          sku: z.string().trim().min(1).max(100),
          price: z.number().min(0),
          quantity: z.number().int().min(0).default(0),
          optionIds: z.array(z.string().uuid()).min(1),
          displayImageId: z.string().uuid().optional().nullable(),
          galleryImageIds: z.array(z.string().uuid()).optional(),
        }),
      )
      .optional(),
    baseVariant: z
      .object({
        sku: z.string().trim().min(1).max(100),
        price: z.number().min(0),
        quantity: z.number().int().min(0).default(0),
        displayImageId: z.string().uuid().optional().nullable(),
        galleryImageIds: z.array(z.string().uuid()).optional(),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    const {
      primaryCategoryId,
      secondaryCategoryIds,
      attributes,
      variants,
      baseVariant,
    } = data;

    if (
      secondaryCategoryIds?.length &&
      secondaryCategoryIds.includes(primaryCategoryId)
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Primary category cannot be included in secondary categories',
        path: ['secondaryCategoryIds'],
      });
    }

    if (baseVariant && (variants?.length || attributes?.length)) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Base variant cannot be used alongside multiple variants or attributes',
        path: ['baseVariant'],
      });
    }

    if (!baseVariant && !variants?.length && !attributes?.length) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Either a base variant or attributes with variants must be provided',
        path: ['baseVariant'],
      });
    }

    if (!variants?.length) return;

    if (!attributes?.length) {
      ctx.addIssue({
        code: 'custom',
        message: 'Attributes must be defined to use variants',
        path: ['variants'],
      });
      return;
    }

    const optionToAttributeMap = new Map<string, string>();
    attributes.forEach((attr) => {
      attr.optionIds.forEach((optionId) => {
        optionToAttributeMap.set(optionId, attr.attributeId);
      });
    });

    const expectedAttributeCount = attributes.length;
    const seenVariantCombinations = new Set<string>();

    variants.forEach((variant, index) => {
      const variantOptionIds = variant.optionIds;
      const variantAttributeIds = new Set<string>();
      let hasInvalidOption = false;

      variantOptionIds.forEach((optionId) => {
        const attrId = optionToAttributeMap.get(optionId);
        if (!attrId) {
          ctx.addIssue({
            code: 'custom',
            message: `Option ID ${optionId} is not defined in attributes`,
            path: ['variants', index, 'optionIds'],
          });
          hasInvalidOption = true;
        } else {
          variantAttributeIds.add(attrId);
        }
      });

      if (hasInvalidOption) return;

      if (variantAttributeIds.size !== expectedAttributeCount) {
        ctx.addIssue({
          code: 'custom',
          message: `Variant must have exactly one option from each of the ${expectedAttributeCount} attributes`,
          path: ['variants', index, 'optionIds'],
        });
      }

      if (variantOptionIds.length !== expectedAttributeCount) {
        ctx.addIssue({
          code: 'custom',
          message: `Variant has ${variantOptionIds.length} options, but expected ${expectedAttributeCount} (one for each attribute)`,
          path: ['variants', index, 'optionIds'],
        });
      }

      const sortedOptions = [...variantOptionIds].sort().join(',');
      if (seenVariantCombinations.has(sortedOptions)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Duplicate variant combination',
          path: ['variants', index],
        });
      }
      seenVariantCombinations.add(sortedOptions);
    });
  });

export class CreateProductDto extends createZodDto(createProductSchema) {}
