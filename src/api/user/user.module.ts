import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { GuestTokenMiddleware } from '@common/middleware/guest-token.middleware';
import { OptionalCustomerMiddleware } from '@common/middleware/optional-customer.middleware';
import { UserAuthModule } from './auth/user-auth.module';
import { CartModule } from './cart/cart.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { CheckoutModule } from './checkout/checkout.module';
import { OrdersModule } from './orders/orders.module';
import { AddressesModule } from './addresses/addresses.module';
import { UserReviewsModule } from './reviews/user-reviews.module';
import { UserReturnsModule } from './returns/user-returns.module';
import { CartController } from './cart/cart.controller';
import { WishlistController } from './wishlist/wishlist.controller';

@Module({
  imports: [
    UserAuthModule,
    CartModule,
    WishlistModule,
    CheckoutModule,
    OrdersModule,
    AddressesModule,
    UserReviewsModule,
    UserReturnsModule,
  ],
})
export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(GuestTokenMiddleware, OptionalCustomerMiddleware)
      .forRoutes(CartController, WishlistController);
  }
}
