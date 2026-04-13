-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_shippingOptionId_fkey";

-- AlterTable
ALTER TABLE "products" DROP COLUMN IF EXISTS "shippingOptionId";

-- DropForeignKey
ALTER TABLE "order_shipping_info" DROP CONSTRAINT IF EXISTS "order_shipping_info_shippingPlaceId_fkey";

-- AlterTable
ALTER TABLE "order_shipping_info" DROP COLUMN IF EXISTS "shippingPlaceId";

-- DropForeignKey
ALTER TABLE "customer_addresses" DROP CONSTRAINT IF EXISTS "customer_addresses_shippingPlaceId_fkey";

-- AlterTable
ALTER TABLE "customer_addresses" DROP COLUMN IF EXISTS "shippingPlaceId";

-- DropTable
DROP TABLE IF EXISTS "shipping_pickup_points";

-- DropTable
DROP TABLE IF EXISTS "shipping_places";

-- DropTable
DROP TABLE IF EXISTS "shipping_options";

-- CreateTable
CREATE TABLE "shipping_methods" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "price" DECIMAL(10, 2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deliveryDays" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_methods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shipping_methods_isActive_idx" ON "shipping_methods"("isActive");

-- AlterTable
ALTER TABLE "products" ADD COLUMN "shippingMethodId" TEXT;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_shippingMethodId_fkey" FOREIGN KEY ("shippingMethodId") REFERENCES "shipping_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "order_shipping_info" ADD COLUMN "shippingMethodId" TEXT;

-- AddForeignKey
ALTER TABLE "order_shipping_info" ADD CONSTRAINT "order_shipping_info_shippingMethodId_fkey" FOREIGN KEY ("shippingMethodId") REFERENCES "shipping_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
