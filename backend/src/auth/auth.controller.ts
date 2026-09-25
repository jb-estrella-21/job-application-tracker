import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import {
  getRefreshCookieValue,
  REFRESH_COOKIE_NAME,
  RefreshSessionService,
} from './refresh-session.service.js';
import { parseCorsOrigins } from '../config/auth.config.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly refreshSessionService: RefreshSessionService,
  ) {}

  @Post('register')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60 * 60 * 1_000 } })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 15 * 60 * 1_000 } })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(dto);
    response.cookie(
      REFRESH_COOKIE_NAME,
      result.refreshCredential,
      this.getCookieOptions(),
    );

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Post('refresh')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 60, ttl: 15 * 60 * 1_000 } })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.assertAllowedOrigin(request);
    const result = await this.authService.refresh(
      getRefreshCookieValue(request.headers.cookie),
    );
    response.cookie(
      REFRESH_COOKIE_NAME,
      result.refreshCredential,
      this.getCookieOptions(),
    );

    return { accessToken: result.accessToken };
  }

  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.assertAllowedOrigin(request);
    await this.authService.logout(getRefreshCookieValue(request.headers.cookie));
    response.clearCookie(REFRESH_COOKIE_NAME, this.getCookieOptions());
    response.status(204);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getMe(@Req() request: Request) {
    return {
      user: request.user,
    };
  }

  private getCookieOptions() {
    return this.refreshSessionService.getCookieOptions();
  }

  private assertAllowedOrigin(request: Request) {
    const origin = request.headers.origin;
    const allowedOrigins = parseCorsOrigins(
      this.configService.getOrThrow<string>('CORS_ORIGINS'),
    );

    if (!origin || !allowedOrigins.includes(origin)) {
      throw new UnauthorizedException('Invalid request origin');
    }
  }
}
