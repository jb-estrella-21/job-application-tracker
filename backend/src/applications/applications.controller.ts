import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { ApplicationsService } from './applications.service.js';
import { CreateApplicationDto } from '../auth/dto/create-application.dto.js';
import { UpdateApplicationDto } from '../auth/dto/update-application.dto.js';
import { ListApplicationsQueryDto } from '../auth/dto/list-applications-query.dto.js';

type AuthenticatedUser = {
  id: string;
  email: string;
};

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

@Controller('applications')
@UseGuards(AuthGuard('jwt'))
export class ApplicationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
  ) {}

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.applicationsService.create(request.user.id, dto);
  }

  @Delete(':id')
    remove(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    ) {
    return this.applicationsService.remove(
        request.user.id,
        id,
    );
    }
  
  @Patch(':id')
    update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationDto,
    ) {
    return this.applicationsService.update(
        request.user.id,
        id,
        dto,
    );
    }
  
  @Get()
    findAll(
      @Req() request: AuthenticatedRequest,
      @Query() query: ListApplicationsQueryDto,
    ) {
      return this.applicationsService.findAll(
        request.user.id,
        query,
      );
    }

  @Get(':id')
    findOne(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    ) {
    return this.applicationsService.findOne(request.user.id, id);
    }
}
