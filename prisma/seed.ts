import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  ItemStatus,
  PrismaClient,
  ProductType,
  SellingUnit,
  TaxType,
} from '@prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DATABASE_URL!),
});

type MediaInput = {
  key: string;
  url: string;
};

type CategorySeed = {
  name: string;
  slug: string;
  isFeature: boolean;
  order: number;
  image: MediaInput;
};

type ProductSeed = {
  categorySlug: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  basePrice: number;
  sku: string;
  quantity: number;
  isFeature?: boolean;
  tags?: string[];
  thumbnail: MediaInput;
  gallery?: MediaInput;
};

const CATEGORIES: CategorySeed[] = [
  {
    name: 'Protein',
    slug: 'protein',
    isFeature: true,
    order: 0,
    image: {
      key: 'seed/category/protein',
      url: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800&q=80',
    },
  },
  {
    name: 'Pre-Workout',
    slug: 'pre-workout',
    isFeature: true,
    order: 1,
    image: {
      key: 'seed/category/pre-workout',
      url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
    },
  },
  {
    name: 'Creatine',
    slug: 'creatine',
    isFeature: true,
    order: 2,
    image: {
      key: 'seed/category/creatine',
      url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
    },
  },
  {
    name: 'Vitamins',
    slug: 'vitamins',
    isFeature: true,
    order: 3,
    image: {
      key: 'seed/category/vitamins',
      url: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=800&q=80',
    },
  },
  {
    name: 'Amino Acids',
    slug: 'amino-acids',
    isFeature: false,
    order: 4,
    image: {
      key: 'seed/category/amino-acids',
      url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
    },
  },
  {
    name: 'Fat Burners',
    slug: 'fat-burners',
    isFeature: false,
    order: 5,
    image: {
      key: 'seed/category/fat-burners',
      url: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800&q=80',
    },
  },
  {
    name: 'Mass Gainers',
    slug: 'mass-gainers',
    isFeature: false,
    order: 6,
    image: {
      key: 'seed/category/mass-gainers',
      url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80',
    },
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    isFeature: false,
    order: 7,
    image: {
      key: 'seed/category/accessories',
      url: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d944?w=800&q=80',
    },
  },
  {
    name: 'Apparel',
    slug: 'apparel',
    isFeature: false,
    order: 8,
    image: {
      key: 'seed/category/apparel',
      url: 'https://images.unsplash.com/photo-1483721310020-03318a1b43d9?w=800&q=80',
    },
  },
  {
    name: 'Recovery',
    slug: 'recovery',
    isFeature: false,
    order: 9,
    image: {
      key: 'seed/category/recovery',
      url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
    },
  },
];

const PRODUCTS: ProductSeed[] = [
  // Protein
  {
    categorySlug: 'protein',
    slug: 'whey-isolate-2lb',
    title: 'Whey Isolate 2lb',
    summary: 'Fast-absorbing whey isolate for post-workout recovery.',
    description:
      'High-purity whey protein isolate with low lactose and carbs. Mixes easily and supports lean muscle recovery after training.',
    basePrice: 49.99,
    sku: 'SEED-PRO-WHEY-2LB',
    quantity: 120,
    isFeature: true,
    tags: ['protein', 'whey', 'isolate'],
    thumbnail: {
      key: 'seed/product/whey-isolate-2lb',
      url: 'https://images.unsplash.com/photo-1579722820308-d74e57ce3fa3?w=800&q=80',
    },
  },
  {
    categorySlug: 'protein',
    slug: 'casein-night-formula',
    title: 'Casein Night Formula',
    summary: 'Slow-release casein for overnight muscle support.',
    description:
      'Micellar casein delivers a steady amino acid release while you sleep. Ideal as a bedtime protein shake.',
    basePrice: 44.99,
    sku: 'SEED-PRO-CASEIN-1',
    quantity: 90,
    tags: ['protein', 'casein'],
    thumbnail: {
      key: 'seed/product/casein-night-formula',
      url: 'https://images.unsplash.com/photo-1622484211149-c6c3e9b6c0a4?w=800&q=80',
    },
  },
  // Pre-Workout
  {
    categorySlug: 'pre-workout',
    slug: 'ignition-pre-workout',
    title: 'Ignition Pre-Workout',
    summary: 'Caffeine-powered formula for focus and intensity.',
    description:
      'Pre-workout blend with caffeine, beta-alanine, and citrulline to support energy, pumps, and training drive.',
    basePrice: 39.99,
    sku: 'SEED-PRE-IGNITION',
    quantity: 150,
    isFeature: true,
    tags: ['pre-workout', 'energy'],
    thumbnail: {
      key: 'seed/product/ignition-pre-workout',
      url: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800&q=80',
    },
  },
  {
    categorySlug: 'pre-workout',
    slug: 'pump-booster-stim-free',
    title: 'Pump Booster Stim-Free',
    summary: 'Stimulant-free pumps for evening sessions.',
    description:
      'Nitric oxide support without caffeine. Great for late workouts when you want pumps without the buzz.',
    basePrice: 34.99,
    sku: 'SEED-PRE-PUMP',
    quantity: 110,
    tags: ['pre-workout', 'stim-free'],
    thumbnail: {
      key: 'seed/product/pump-booster-stim-free',
      url: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=800&q=80',
    },
  },
  // Creatine
  {
    categorySlug: 'creatine',
    slug: 'creatine-monohydrate-300g',
    title: 'Creatine Monohydrate 300g',
    summary: 'Micronized creatine for strength and power.',
    description:
      'Pure creatine monohydrate to support ATP regeneration, strength, and lean mass when used consistently.',
    basePrice: 24.99,
    sku: 'SEED-CRE-MONO-300',
    quantity: 200,
    isFeature: true,
    tags: ['creatine'],
    thumbnail: {
      key: 'seed/product/creatine-monohydrate-300g',
      url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
    },
  },
  {
    categorySlug: 'creatine',
    slug: 'creatine-hcl-capsules',
    title: 'Creatine HCl Capsules',
    summary: 'Convenient creatine HCl capsules.',
    description:
      'Easy-to-take creatine HCl capsules for athletes who prefer pills over powder.',
    basePrice: 29.99,
    sku: 'SEED-CRE-HCL-CAPS',
    quantity: 140,
    tags: ['creatine', 'capsules'],
    thumbnail: {
      key: 'seed/product/creatine-hcl-capsules',
      url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80',
    },
  },
  // Vitamins
  {
    categorySlug: 'vitamins',
    slug: 'daily-multivitamin',
    title: 'Daily Multivitamin',
    summary: 'Everyday micronutrient support for active lifestyles.',
    description:
      'Comprehensive multivitamin covering key vitamins and minerals to fill dietary gaps for gym-goers.',
    basePrice: 19.99,
    sku: 'SEED-VIT-MULTI',
    quantity: 180,
    tags: ['vitamins', 'daily'],
    thumbnail: {
      key: 'seed/product/daily-multivitamin',
      url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80',
    },
  },
  {
    categorySlug: 'vitamins',
    slug: 'vitamin-d3-k2',
    title: 'Vitamin D3 + K2',
    summary: 'Bone and immune support combo.',
    description:
      'Vitamin D3 paired with K2 to support bone health, calcium utilization, and immune function.',
    basePrice: 16.99,
    sku: 'SEED-VIT-D3K2',
    quantity: 160,
    tags: ['vitamins', 'd3'],
    thumbnail: {
      key: 'seed/product/vitamin-d3-k2',
      url: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&q=80',
    },
  },
  // Amino Acids
  {
    categorySlug: 'amino-acids',
    slug: 'bcaa-2-1-1',
    title: 'BCAA 2:1:1',
    summary: 'Branched-chain amino acids for training and recovery.',
    description:
      'Classic 2:1:1 BCAA ratio to support muscle protein synthesis and reduce perceived fatigue during training.',
    basePrice: 27.99,
    sku: 'SEED-AA-BCAA',
    quantity: 130,
    tags: ['bcaa', 'amino'],
    thumbnail: {
      key: 'seed/product/bcaa-2-1-1',
      url: 'https://images.unsplash.com/photo-1599058945522-28d884b53496?w=800&q=80',
    },
  },
  {
    categorySlug: 'amino-acids',
    slug: 'essential-eaa-complex',
    title: 'Essential EAA Complex',
    summary: 'Full essential amino acid spectrum.',
    description:
      'Complete EAA blend for athletes who want more than BCAAs—ideal around fasted or long sessions.',
    basePrice: 32.99,
    sku: 'SEED-AA-EAA',
    quantity: 100,
    tags: ['eaa', 'amino'],
    thumbnail: {
      key: 'seed/product/essential-eaa-complex',
      url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80',
    },
  },
  // Fat Burners
  {
    categorySlug: 'fat-burners',
    slug: 'thermo-burn-caps',
    title: 'Thermo Burn Caps',
    summary: 'Thermogenic support with caffeine.',
    description:
      'Capsules formulated to support metabolism and focus as part of a calorie-controlled training plan.',
    basePrice: 36.99,
    sku: 'SEED-FAT-THERMO',
    quantity: 95,
    tags: ['fat-burner', 'thermo'],
    thumbnail: {
      key: 'seed/product/thermo-burn-caps',
      url: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=800&q=80',
    },
  },
  {
    categorySlug: 'fat-burners',
    slug: 'l-carnitine-liquid',
    title: 'L-Carnitine Liquid',
    summary: 'Liquid L-carnitine for easy dosing.',
    description:
      'Convenient liquid L-carnitine to support fat metabolism alongside diet and cardio.',
    basePrice: 22.99,
    sku: 'SEED-FAT-CARN',
    quantity: 125,
    tags: ['carnitine'],
    thumbnail: {
      key: 'seed/product/l-carnitine-liquid',
      url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
    },
  },
  // Mass Gainers
  {
    categorySlug: 'mass-gainers',
    slug: 'mass-stack-gainer',
    title: 'Mass Stack Gainer',
    summary: 'High-calorie shake for hardgainers.',
    description:
      'Calorie-dense mass gainer with protein and carbs to help you hit surplus targets between meals.',
    basePrice: 54.99,
    sku: 'SEED-MASS-STACK',
    quantity: 80,
    isFeature: true,
    tags: ['gainer', 'mass'],
    thumbnail: {
      key: 'seed/product/mass-stack-gainer',
      url: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&q=80',
    },
  },
  {
    categorySlug: 'mass-gainers',
    slug: 'lean-mass-builder',
    title: 'Lean Mass Builder',
    summary: 'Moderate-calorie gainer for cleaner bulks.',
    description:
      'Balanced protein-to-carb ratio for athletes who want mass without an ultra-heavy shake.',
    basePrice: 47.99,
    sku: 'SEED-MASS-LEAN',
    quantity: 85,
    tags: ['gainer', 'lean'],
    thumbnail: {
      key: 'seed/product/lean-mass-builder',
      url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80',
    },
  },
  // Accessories
  {
    categorySlug: 'accessories',
    slug: 'lifting-straps-pair',
    title: 'Lifting Straps Pair',
    summary: 'Durable straps for heavy pulls.',
    description:
      'Cotton lifting straps to reinforce grip on deadlifts, rows, and shrugs.',
    basePrice: 14.99,
    sku: 'SEED-ACC-STRAPS',
    quantity: 200,
    tags: ['accessories', 'grip'],
    thumbnail: {
      key: 'seed/product/lifting-straps-pair',
      url: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d944?w=800&q=80',
    },
  },
  {
    categorySlug: 'accessories',
    slug: 'shaker-bottle-700ml',
    title: 'Shaker Bottle 700ml',
    summary: 'Leak-resistant shaker with mixing ball.',
    description:
      'BPA-free 700ml shaker bottle designed for protein and pre-workout mixes on the go.',
    basePrice: 9.99,
    sku: 'SEED-ACC-SHAKER',
    quantity: 250,
    tags: ['accessories', 'shaker'],
    thumbnail: {
      key: 'seed/product/shaker-bottle-700ml',
      url: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800&q=80',
    },
  },
  // Apparel
  {
    categorySlug: 'apparel',
    slug: 'performance-training-tee',
    title: 'Performance Training Tee',
    summary: 'Breathable tee for high-intensity sessions.',
    description:
      'Moisture-wicking training t-shirt with a athletic fit for lifting and cardio.',
    basePrice: 28.99,
    sku: 'SEED-APP-TEE',
    quantity: 100,
    tags: ['apparel', 'tee'],
    thumbnail: {
      key: 'seed/product/performance-training-tee',
      url: 'https://images.unsplash.com/photo-1483721310020-03318a1b43d9?w=800&q=80',
    },
  },
  {
    categorySlug: 'apparel',
    slug: 'flex-training-shorts',
    title: 'Flex Training Shorts',
    summary: 'Lightweight shorts with stretch fabric.',
    description:
      'Gym shorts built for squats and sprints—flexible fabric and a secure waistband.',
    basePrice: 32.99,
    sku: 'SEED-APP-SHORTS',
    quantity: 95,
    tags: ['apparel', 'shorts'],
    thumbnail: {
      key: 'seed/product/flex-training-shorts',
      url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80',
    },
  },
  // Recovery
  {
    categorySlug: 'recovery',
    slug: 'electrolyte-recovery-drink',
    title: 'Electrolyte Recovery Drink',
    summary: 'Replenish fluids after hard sessions.',
    description:
      'Electrolyte mix to support hydration and recovery after sweat-heavy workouts.',
    basePrice: 18.99,
    sku: 'SEED-REC-ELECTRO',
    quantity: 170,
    tags: ['recovery', 'electrolytes'],
    thumbnail: {
      key: 'seed/product/electrolyte-recovery-drink',
      url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
    },
  },
  {
    categorySlug: 'recovery',
    slug: 'foam-roller-standard',
    title: 'Foam Roller Standard',
    summary: 'Self-myofascial release roller.',
    description:
      'Firm foam roller for mobility work, warm-ups, and post-training muscle recovery.',
    basePrice: 21.99,
    sku: 'SEED-REC-ROLLER',
    quantity: 75,
    tags: ['recovery', 'mobility'],
    thumbnail: {
      key: 'seed/product/foam-roller-standard',
      url: 'https://images.unsplash.com/photo-1518611507436-f9221403cca2?w=800&q=80',
    },
  },
];

async function ensureMedia(input: MediaInput) {
  return prisma.adminMedia.upsert({
    where: { key: input.key },
    create: {
      key: input.key,
      url: input.url,
      provider: 'url',
      mimeType: 'image/jpeg',
      resourceType: 'image',
      format: 'jpg',
      width: 800,
      height: 800,
      size: 120_000,
    },
    update: {
      url: input.url,
      provider: 'url',
      mimeType: 'image/jpeg',
      resourceType: 'image',
      format: 'jpg',
      width: 800,
      height: 800,
      size: 120_000,
    },
  });
}

async function ensureTax() {
  const existing = await prisma.tax.findFirst({
    where: { name: 'Standard VAT', deletedAt: null },
  });

  if (existing) {
    return prisma.tax.update({
      where: { id: existing.id },
      data: {
        rate: 15,
        type: TaxType.PERCENTAGE,
        isDefault: true,
        isActive: true,
      },
    });
  }

  return prisma.tax.create({
    data: {
      name: 'Standard VAT',
      rate: 15,
      type: TaxType.PERCENTAGE,
      isDefault: true,
      isActive: true,
    },
  });
}

async function ensureCategories() {
  const bySlug = new Map<string, string>();

  for (const category of CATEGORIES) {
    const image = await ensureMedia(category.image);
    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      create: {
        name: category.name,
        slug: category.slug,
        status: ItemStatus.ACTIVE,
        isFeature: category.isFeature,
        order: category.order,
        imageId: image.id,
      },
      update: {
        name: category.name,
        status: ItemStatus.ACTIVE,
        isFeature: category.isFeature,
        order: category.order,
        imageId: image.id,
        deletedAt: null,
      },
    });
    bySlug.set(row.slug, row.id);
  }

  return bySlug;
}

async function ensureBaseVariantAndInventory(params: {
  productId: string;
  sku: string;
  price: number;
  quantity: number;
}) {
  const existing = await prisma.productVariant.findUnique({
    where: {
      productId_sku: {
        productId: params.productId,
        sku: params.sku,
      },
    },
  });

  const variant =
    existing ??
    (await prisma.productVariant.create({
      data: {
        productId: params.productId,
        sku: params.sku,
        price: params.price,
        quantity: params.quantity,
        status: ItemStatus.ACTIVE,
        isBase: true,
      },
    }));

  if (existing) {
    await prisma.productVariant.update({
      where: { id: existing.id },
      data: {
        price: params.price,
        quantity: params.quantity,
        status: ItemStatus.ACTIVE,
        isBase: true,
      },
    });
  }

  await prisma.inventory.upsert({
    where: { variantId: variant.id },
    create: {
      variantId: variant.id,
      quantityOnHand: params.quantity,
      quantityReserved: 0,
    },
    update: {
      quantityOnHand: params.quantity,
      quantityReserved: 0,
    },
  });

  return variant;
}

async function ensureProductGallery(productId: string, imageId: string) {
  const existing = await prisma.productSampleImage.findFirst({
    where: { productId, variantId: null, imageId },
  });

  if (existing) {
    return existing;
  }

  // Keep a single product-level gallery image for seed products.
  await prisma.productSampleImage.deleteMany({
    where: { productId, variantId: null },
  });

  return prisma.productSampleImage.create({
    data: {
      productId,
      variantId: null,
      imageId,
      order: 0,
    },
  });
}

async function ensureProducts(
  categoryIdsBySlug: Map<string, string>,
  taxId: string,
) {
  for (const product of PRODUCTS) {
    const categoryId = categoryIdsBySlug.get(product.categorySlug);
    if (!categoryId) {
      throw new Error(`Missing category for slug: ${product.categorySlug}`);
    }

    const thumbnail = await ensureMedia(product.thumbnail);
    const galleryMedia = product.gallery
      ? await ensureMedia(product.gallery)
      : thumbnail;

    const row = await prisma.product.upsert({
      where: { slug: product.slug },
      create: {
        categoryId,
        slug: product.slug,
        title: product.title,
        summary: product.summary,
        description: product.description,
        basePrice: product.basePrice,
        taxId,
        isTaxIncluded: false,
        status: ItemStatus.ACTIVE,
        type: ProductType.PHYSICAL,
        sellingUnit: SellingUnit.PIECE,
        isFeature: product.isFeature ?? false,
        tags: product.tags ?? [],
        thumbnailId: thumbnail.id,
        lowStockThreshold: 10,
      },
      update: {
        categoryId,
        title: product.title,
        summary: product.summary,
        description: product.description,
        basePrice: product.basePrice,
        taxId,
        isTaxIncluded: false,
        status: ItemStatus.ACTIVE,
        type: ProductType.PHYSICAL,
        sellingUnit: SellingUnit.PIECE,
        isFeature: product.isFeature ?? false,
        tags: product.tags ?? [],
        thumbnailId: thumbnail.id,
        lowStockThreshold: 10,
        deletedAt: null,
      },
    });

    await ensureProductGallery(row.id, galleryMedia.id);
    await ensureBaseVariantAndInventory({
      productId: row.id,
      sku: product.sku,
      price: product.basePrice,
      quantity: product.quantity,
    });
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to run the seed');
  }

  console.log('Seeding catalog: tax, categories, products...');

  const tax = await ensureTax();
  const categoryIds = await ensureCategories();
  await ensureProducts(categoryIds, tax.id);

  console.log(
    `Done. Tax=1, categories=${CATEGORIES.length}, products=${PRODUCTS.length}`,
  );
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
