import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { sendResponse } from '../../../common/helpers/send.response';
import { Public } from '../../../common/decorators/public.decorator';
import { GuestToken } from '../common/decorators/guest-token.decorator';
import { CurrentCustomerId } from '../common/decorators/current-customer-id.decorator';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { SyncCartDto } from './dto/sync-cart.dto';
import { CartService } from './cart.service';

@Public()
@Controller('public/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('items')
  @HttpCode(HttpStatus.OK)
  async addToCart(
    @Body() payload: AddToCartDto,
    @CurrentCustomerId() customerId: string | undefined,
    @GuestToken() guestToken: string | undefined,
  ) {
    const data = await this.cartService.addToCart(payload, {
      customerId,
      guestToken,
    });

    return sendResponse({
      success: true,
      message: 'Item added to cart successfully',
      data,
    });
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async syncCart(
    @Body() payload: SyncCartDto,
    @GuestToken() guestToken: string | undefined,
  ) {
    const data = await this.cartService.syncCart(payload.customerId, guestToken);

    return sendResponse({
      success: true,
      message: 'Cart synchronized successfully',
      data,
    });
  }
}
