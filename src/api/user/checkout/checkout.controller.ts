import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { sendResponse } from '@common/helpers/send.response';
import { Public } from '@common/decorators/public.decorator';
import { CurrentCustomer } from '@common/decorators/current-customer.decorator';
import { CustomerAuthGuard } from '@common/guards/customer-auth.guard';
import type { CustomerSessionData } from '../auth/types/customer-session.types';
import { CheckoutService } from './checkout.service';
import { PlaceOrderDto } from './dto/place-order.dto';
import { PreviewCheckoutDto } from './dto/preview-checkout.dto';

@Controller('user/checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Public()
  @Get('payment-methods')
  @HttpCode(HttpStatus.OK)
  async paymentMethods() {
    const data = await this.checkoutService.getPaymentMethods();
    return sendResponse({
      success: true,
      message: 'Payment methods retrieved',
      data,
    });
  }

  @Public()
  @Get('shipping-methods')
  @HttpCode(HttpStatus.OK)
  async shippingMethods() {
    const data = await this.checkoutService.getShippingMethods();
    return sendResponse({
      success: true,
      message: 'Shipping methods retrieved',
      data,
    });
  }

  @Public()
  @UseGuards(CustomerAuthGuard)
  @Post('preview')
  @HttpCode(HttpStatus.OK)
  async preview(
    @CurrentCustomer() customer: CustomerSessionData,
    @Body() dto: PreviewCheckoutDto,
  ) {
    const data = await this.checkoutService.previewCheckout(customer.id, dto);
    return sendResponse({
      success: true,
      message: 'Totals calculated',
      data,
    });
  }

  @Public()
  @UseGuards(CustomerAuthGuard)
  @Post('place-order')
  @HttpCode(HttpStatus.OK)
  async placeOrder(
    @CurrentCustomer() customer: CustomerSessionData,
    @Body() dto: PlaceOrderDto,
  ) {
    const data = await this.checkoutService.placeOrder(customer.id, dto);
    return sendResponse({
      success: true,
      message: 'Order placed successfully',
      data,
    });
  }
}
