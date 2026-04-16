import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PublicMediaController } from './media/public-media.controller';
import { PublicProductsController } from './products/public-products.controller';
import { PublicProductsService } from './products/public-products.service';
import { CartModule } from './cart/cart.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { GuestTokenMiddleware } from './common/middleware/guest-token.middleware';
import { CartController } from './cart/cart.controller';
import { WishlistController } from './wishlist/wishlist.controller';

@Module({
  imports: [PrismaModule, CartModule, WishlistModule],
  controllers: [PublicMediaController, PublicProductsController],
  providers: [PublicProductsService],
})
export class PublicModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(GuestTokenMiddleware).forRoutes(
      CartController,
      WishlistController,
    );
  }
}
