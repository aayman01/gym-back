import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_PIPE, APP_INTERCEPTOR, APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { ThrottlerGuard } from '@nestjs/throttler';
import { validate } from './config/env.schema';
import configuration from './config/configuration';
import { AppConfigModule } from './config/app_config/app_config.module';
import { GlobalExceptionFilter } from './common/filters/global.exception.handler';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ProductVariantAdminModule } from './api/admin/product-variants/product-variant-admin.module';
import { ProductAttributeAdminModule } from './api/admin/product-attributes/product-attribute-admin.module';
import { CategoryAdminModule } from './api/admin/categories/category-admin.module';
import { BrandAdminModule } from './api/admin/brands/brand-admin.module';
import { TaxAdminModule } from './api/admin/taxes/tax-admin.module';
import { ShippingMethodAdminModule } from './api/admin/shipping-methods/shipping-method-admin.module';
import { AdminAuthModule } from './api/admin/auth/admin-auth.module';
import { AdminSessionGuard } from './common/guards/admin-session.guard';
import { AdminCsrfGuard } from './common/guards/admin-csrf.guard';
import { AdminMediaModule } from './api/admin/media/admin-media.module';
import { AdminGalleryModule } from './api/admin/gallery/admin-gallery.module';
import { ProductsAdminModule } from './api/admin/products/products-admin.module';
import { PublicModule } from './api/public/public.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
    AppConfigModule,
    PrismaModule,
    ProductVariantAdminModule,
    ProductAttributeAdminModule,
    CategoryAdminModule,
    BrandAdminModule,
    TaxAdminModule,
    ShippingMethodAdminModule,
    AdminAuthModule,
    AdminMediaModule,
    AdminGalleryModule,
    ProductsAdminModule,
    PublicModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AdminSessionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AdminCsrfGuard,
    },
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
