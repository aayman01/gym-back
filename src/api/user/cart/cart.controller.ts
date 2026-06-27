import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { sendResponse } from '@common/helpers/send.response';
import { Public } from '@common/decorators/public.decorator';
import { GuestToken } from '@common/decorators/guest-token.decorator';
import { CurrentCustomerId } from '@common/decorators/current-customer-id.decorator';
import { CurrentCustomer } from '@common/decorators/current-customer.decorator';
import { CustomerAuthGuard } from '@common/guards/customer-auth.guard';
import type { CustomerSessionData } from '../auth/types/customer-session.types';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartItemParamDto } from './dto/cart-item-param.dto';
import { CartService } from './cart.service';

@Public()
@Controller('user/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getCart(
    @CurrentCustomerId() customerId: string | undefined,
    @GuestToken() guestToken: string | undefined,
  ) {
    const data = await this.cartService.getCart({ customerId, guestToken });
    return sendResponse({
      success: true,
      message: 'Cart retrieved successfully',
      data,
    });
  }

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

  @Patch('items/:itemId')
  @HttpCode(HttpStatus.OK)
  async updateCartItem(
    @Param() param: CartItemParamDto,
    @Body() payload: UpdateCartItemDto,
    @CurrentCustomerId() customerId: string | undefined,
    @GuestToken() guestToken: string | undefined,
  ) {
    const data = await this.cartService.updateCartItem(
      param.itemId,
      payload,
      { customerId, guestToken },
    );
    return sendResponse({
      success: true,
      message: 'Cart item updated successfully',
      data,
    });
  }

  @Delete('items/:itemId')
  @HttpCode(HttpStatus.OK)
  async removeCartItem(
    @Param() param: CartItemParamDto,
    @CurrentCustomerId() customerId: string | undefined,
    @GuestToken() guestToken: string | undefined,
  ) {
    const data = await this.cartService.removeCartItem(param.itemId, {
      customerId,
      guestToken,
    });
    return sendResponse({
      success: true,
      message: 'Cart item removed successfully',
      data,
    });
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async clearCart(
    @CurrentCustomerId() customerId: string | undefined,
    @GuestToken() guestToken: string | undefined,
  ) {
    const data = await this.cartService.clearCart({ customerId, guestToken });
    return sendResponse({
      success: true,
      message: 'Cart cleared successfully',
      data,
    });
  }

  @Post('merge')
  @UseGuards(CustomerAuthGuard)
  @HttpCode(HttpStatus.OK)
  async mergeCart(
    @CurrentCustomer() customer: CustomerSessionData,
    @GuestToken() guestToken: string | undefined,
  ) {
    const data = await this.cartService.mergeCart(customer.id, guestToken);
    return sendResponse({
      success: true,
      message: 'Cart merged successfully',
      data,
    });
  }

  // kept for backward-compat
  @Post('sync')
  @UseGuards(CustomerAuthGuard)
  @HttpCode(HttpStatus.OK)
  async syncCart(
    @CurrentCustomer() customer: CustomerSessionData,
    @GuestToken() guestToken: string | undefined,
  ) {
    const data = await this.cartService.mergeCart(customer.id, guestToken);
    return sendResponse({
      success: true,
      message: 'Cart synchronized successfully',
      data,
    });
  }
}
