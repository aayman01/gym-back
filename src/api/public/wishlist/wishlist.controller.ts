import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Public } from '../../../common/decorators/public.decorator';
import { sendResponse } from '../../../common/helpers/send.response';
import { CurrentCustomerId } from '../common/decorators/current-customer-id.decorator';
import { GuestToken } from '../common/decorators/guest-token.decorator';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { SyncWishlistDto } from './dto/sync-wishlist.dto';
import { WishlistService } from './wishlist.service';

@Public()
@Controller('public/wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post('items')
  @HttpCode(HttpStatus.OK)
  async addToWishlist(
    @Body() payload: AddToWishlistDto,
    @CurrentCustomerId() customerId: string | undefined,
    @GuestToken() guestToken: string | undefined,
  ) {
    const data = await this.wishlistService.addToWishlist(payload, {
      customerId,
      guestToken,
    });

    return sendResponse({
      success: true,
      message: 'Item added to wishlist successfully',
      data,
    });
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async syncWishlist(
    @Body() payload: SyncWishlistDto,
    @GuestToken() guestToken: string | undefined,
  ) {
    const data = await this.wishlistService.syncWishlist(
      payload.customerId,
      guestToken,
    );

    return sendResponse({
      success: true,
      message: 'Wishlist synchronized successfully',
      data,
    });
  }
}
