import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { MealService } from './meal.service';
import { CreateMealDto } from './dto/create-meal.dto';
import { Request } from 'express';
import { User } from '../../entities/user.entity';
import { JwtAuthGuard } from '../../libs/guards/auth.guard';

@Controller('meals')
@UseGuards(JwtAuthGuard)
export class MealController {
  constructor(private readonly mealService: MealService) {}

  @Post()
  async addMeal(@Body() dto: CreateMealDto, @Req() req: Request) {
    const user = req.user as User;
    return this.mealService.addMeal(dto, user);
  }

  @Get()
  async getMeals(@Query('date') date: string, @Req() req: Request) {
    const user = req.user as User;

    if (!date) {
      throw new BadRequestException('Missing required query parameter: date');
    }

    return this.mealService.getMealsSummaryForDay(date, user);
  }
}
