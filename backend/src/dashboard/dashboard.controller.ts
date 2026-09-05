import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { DashboardService } from './dashboard.service.js';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
    email: string;
  };
};

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
  ) {}

  @Get('summary')
  getSummary(@Req() request: AuthenticatedRequest) {
    return this.dashboardService.getSummary(
      request.user.id,
    );
  }
}