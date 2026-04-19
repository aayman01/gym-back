import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppConfigService } from '../../../config/app_config/app_config.service';
import { parseDuration } from '@common/helpers/duration.helper';
import { sendResponse } from '@common/helpers/send.response';
import { Public } from '@common/decorators/public.decorator';
import { CurrentCustomer } from '@common/decorators/current-customer.decorator';
import { UserAuthService } from './user-auth.service';
import { PublicRegisterDto } from './dto/register.dto';
import { PublicLoginDto } from './dto/login.dto';
import type { CustomerSessionData } from './types/customer-session.types';
import { CustomerAuthGuard } from '@common/guards/customer-auth.guard';

@Controller('user/auth')
export class UserAuthController {
  constructor(
    private readonly userAuthService: UserAuthService,
    private readonly configService: AppConfigService,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() dto: PublicRegisterDto) {
    const data = await this.userAuthService.register(dto);
    return sendResponse({
      success: true,
      message: 'Registered successfully',
      data,
    });
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: PublicLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, customer } =
      await this.userAuthService.login(dto);

    const csrfToken = this.userAuthService.generateCsrfToken();

    const cookieOptions = {
      httpOnly: true,
      secure: this.configService.nodeEnv === 'production',
      sameSite:
        this.configService.nodeEnv === 'production'
          ? ('none' as const)
          : ('lax' as const),
      path: '/',
    };

    res.cookie('customer_access_token', accessToken, {
      ...cookieOptions,
      maxAge: parseDuration(this.configService.customerJwtAccessExpires),
    });

    res.cookie('customer_refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: parseDuration(this.configService.customerJwtRefreshExpires),
    });

    res.cookie('XSRF-TOKEN', csrfToken, {
      ...cookieOptions,
      httpOnly: false,
      maxAge: parseDuration(this.configService.customerJwtAccessExpires),
    });

    return sendResponse({
      success: true,
      message: 'Login successful',
      data: customer,
    });
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.customer_refresh_token as string;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token found');
    }

    const {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      customer,
    } = await this.userAuthService.refreshTokens(refreshToken);

    const csrfToken = this.userAuthService.generateCsrfToken();

    const cookieOptions = {
      httpOnly: true,
      secure: this.configService.nodeEnv === 'production',
      sameSite:
        this.configService.nodeEnv === 'production'
          ? ('none' as const)
          : ('lax' as const),
      path: '/',
    };

    res.cookie('customer_access_token', newAccessToken, {
      ...cookieOptions,
      maxAge: parseDuration(this.configService.customerJwtAccessExpires),
    });

    res.cookie('customer_refresh_token', newRefreshToken, {
      ...cookieOptions,
      maxAge: parseDuration(this.configService.customerJwtRefreshExpires),
    });

    res.cookie('XSRF-TOKEN', csrfToken, {
      ...cookieOptions,
      httpOnly: false,
      maxAge: parseDuration(this.configService.customerJwtAccessExpires),
    });

    return sendResponse({
      success: true,
      message: 'Token refreshed successfully',
      data: customer,
    });
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const accessToken = req.cookies?.customer_access_token as string;
    if (accessToken) {
      await this.userAuthService.logout(accessToken);
    }

    res.clearCookie('customer_access_token', { path: '/' });
    res.clearCookie('customer_refresh_token', { path: '/' });

    return sendResponse({
      success: true,
      message: 'Logged out successfully',
      data: null,
    });
  }

  @Public()
  @UseGuards(CustomerAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  me(@CurrentCustomer() customer: CustomerSessionData) {
    return sendResponse({
      success: true,
      message: 'Session valid',
      data: customer,
    });
  }
}
