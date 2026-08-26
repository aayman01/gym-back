import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Public } from '@common/decorators/public.decorator';
import { sendResponse } from '@common/helpers/send.response';
import { CurrentCustomerId } from '@common/decorators/current-customer-id.decorator';
import { CurrentCustomer } from '@common/decorators/current-customer.decorator';
import { GuestToken } from '@common/decorators/guest-token.decorator';
import { CustomerAuthGuard } from '@common/guards/customer-auth.guard';
import type { CustomerSessionData } from '../auth/types/customer-session.types';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { WishlistItemParamDto } from './dto/wishlist-item-param.dto';
import { WishlistService } from './wishlist.service';

@Public()
@Controller('user/wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getWishlist(
    @CurrentCustomerId() customerId: string | undefined,
    @GuestToken() guestToken: string | undefined,
  ) {
    const data = await this.wishlistService.getWishlist({
      customerId,
      guestToken,
    });
    return sendResponse({
      success: true,
      message: 'Wishlist retrieved successfully',
      data,
    });
  }

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

  @Delete('items/:itemId')
  @HttpCode(HttpStatus.OK)
  async removeItem(
    @Param() param: WishlistItemParamDto,
    @CurrentCustomerId() customerId: string | undefined,
    @GuestToken() guestToken: string | undefined,
  ) {
    const data = await this.wishlistService.removeItem(param.itemId, {
      customerId,
      guestToken,
    });
    return sendResponse({
      success: true,
      message: 'Item removed from wishlist',
      data,
    });
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async clear(
    @CurrentCustomerId() customerId: string | undefined,
    @GuestToken() guestToken: string | undefined,
  ) {
    const data = await this.wishlistService.clearWishlist({
      customerId,
      guestToken,
    });
    return sendResponse({
      success: true,
      message: 'Wishlist cleared',
      data,
    });
  }

  @Post('merge')
  @UseGuards(CustomerAuthGuard)
  @HttpCode(HttpStatus.OK)
  async mergeWishlist(
    @CurrentCustomer() customer: CustomerSessionData,
    @GuestToken() guestToken: string | undefined,
  ) {
    const data = await this.wishlistService.syncWishlist(
      customer.id,
      guestToken,
    );
    return sendResponse({
      success: true,
      message: 'Wishlist merged successfully',
      data,
    });
  }

  @Post('sync')
  @UseGuards(CustomerAuthGuard)
  @HttpCode(HttpStatus.OK)
  async syncWishlist(
    @CurrentCustomer() customer: CustomerSessionData,
    @GuestToken() guestToken: string | undefined,
  ) {
    const data = await this.wishlistService.syncWishlist(
      customer.id,
      guestToken,
    );
    return sendResponse({
      success: true,
      message: 'Wishlist synchronized successfully',
      data,
    });
  }
}
