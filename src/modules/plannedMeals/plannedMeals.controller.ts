import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../libs/guards/auth.guard';
import { PlannedMealsListDto } from './dto/get-planned-meals';
import { CreatePlannedMealDto } from './dto/create-planned-meal';
import { PlannedMealsService } from './plannedMeals.service';

@Controller('client-coach/:relationId/planned-meals')
@UseGuards(JwtAuthGuard)
export class PlannedMealsController {
  constructor(private readonly svc: PlannedMealsService) {}

  @Post()
  create(
    @Req() req,
    @Param('relationId') relationId: string,
    @Body() dto: CreatePlannedMealDto,
  ) {
    return this.svc.create(req.user.id, relationId, dto);
  }

  @Get()
  list(
    @Req() req,
    @Param('relationId') relationId: string,
    @Query() q: PlannedMealsListDto,
  ) {
    return this.svc.listForDate(req.user.id, relationId, q.date);
  }
}
