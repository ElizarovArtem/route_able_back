import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { Public } from '../../config/decorators/public.decorator';
import { CurrentUser } from '../../config/decorators/current-user.decorator';
import { JwtUser } from '../../config/interfaces/jwt-payload';
import { Request } from 'express';
import { JwtAuthGuard } from '../../libs/guards/auth.guard';
import { RolesGuard } from '../../libs/guards/roles.guard';
import { RolesDecorator } from '../../config/decorators/roles.decorator';
import { Roles } from '../../config/emuns/user';
import { ListFeedbackQueryDto } from './dto/list-feedback.query';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @Public()
  create(
    @Body() dto: CreateFeedbackDto,
    @Req() req: Request,
    @CurrentUser() user?: JwtUser,
  ) {
    return this.feedbackService.create(dto, req, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(Roles.Admin)
  list(@Query() query: ListFeedbackQueryDto) {
    return this.feedbackService.list(query);
  }
}
