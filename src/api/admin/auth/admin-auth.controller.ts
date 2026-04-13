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
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppConfigService } from '../../../config/app_config/app_config.service';
import { parseDuration } from '../../../common/helpers/duration.helper';
import { sendResponse } from '../../../common/helpers/send.response';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentAdmin } from '../../../common/decorators/current-admin.decorator';
import { AdminAuthService } from './admin-auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { AdminSessionData } from './types/admin-session.types';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly configService: AppConfigService,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const data = await this.adminAuthService.register(dto);
    return sendResponse({
      success: true,
      message: 'Admin registered successfully',
      data,
    });
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, admin } =
      await this.adminAuthService.login(dto);

    const csrfToken = this.adminAuthService.generateCsrfToken();

    const cookieOptions = {
      httpOnly: true,
      secure: this.configService.nodeEnv === 'production',
      sameSite:
        this.configService.nodeEnv === 'production'
          ? ('none' as const)
          : ('lax' as const),
    };

    res.cookie('admin_access_token', accessToken, {
      ...cookieOptions,
      maxAge: parseDuration(this.configService.adminJwtAccessExpires),
    });

    res.cookie('admin_refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: parseDuration(this.configService.adminJwtRefreshExpires),
    });

    res.cookie('XSRF-TOKEN', csrfToken, {
      ...cookieOptions,
      httpOnly: false,
      maxAge: parseDuration(this.configService.adminJwtAccessExpires),
    });

    return sendResponse({
      success: true,
      message: 'Login successful',
      data: admin,
    });
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.admin_refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token found');
    }

    const {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      admin,
    } = await this.adminAuthService.refreshTokens(refreshToken);

    const csrfToken = this.adminAuthService.generateCsrfToken();

    const cookieOptions = {
      httpOnly: true,
      secure: this.configService.nodeEnv === 'production',
      sameSite:
        this.configService.nodeEnv === 'production'
          ? ('none' as const)
          : ('lax' as const),
    };

    res.cookie('admin_access_token', newAccessToken, {
      ...cookieOptions,
      maxAge: parseDuration(this.configService.adminJwtAccessExpires),
    });

    res.cookie('admin_refresh_token', newRefreshToken, {
      ...cookieOptions,
      maxAge: parseDuration(this.configService.adminJwtRefreshExpires),
    });

    res.cookie('XSRF-TOKEN', csrfToken, {
      ...cookieOptions,
      httpOnly: false,
      maxAge: parseDuration(this.configService.adminJwtAccessExpires),
    });

    return sendResponse({
      success: true,
      message: 'Token refreshed successfully',
      data: admin,
    });
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const accessToken = req.cookies?.admin_access_token;
    if (accessToken) {
      await this.adminAuthService.logout(accessToken);
    }

    res.clearCookie('admin_access_token');
    res.clearCookie('admin_refresh_token');
    res.clearCookie('XSRF-TOKEN');

    return sendResponse({
      success: true,
      message: 'Logged out successfully',
      data: null,
    });
  }

  @Get('me')
  async me(@CurrentAdmin() admin: AdminSessionData) {
    return sendResponse({
      success: true,
      message: 'Session valid',
      data: admin,
    });
  }
}
