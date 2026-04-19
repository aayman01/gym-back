import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { GuestTokenMiddleware } from '@common/middleware/guest-token.middleware';
import { UserAuthModule } from './auth/user-auth.module';
import { CartModule } from './cart/cart.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { CheckoutModule } from './checkout/checkout.module';
import { OrdersModule } from './orders/orders.module';
import { CartController } from './cart/cart.controller';
import { WishlistController } from './wishlist/wishlist.controller';

@Module({
  imports: [
    UserAuthModule,
    CartModule,
    WishlistModule,
    CheckoutModule,
    OrdersModule,
  ],
})
export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(GuestTokenMiddleware)
      .forRoutes(CartController, WishlistController);
  }
}
