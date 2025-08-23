import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Query,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { MealService } from './meal.service';
import { CreateMealDto } from './dto/create-meal.dto';
import { Request } from 'express';
import { User } from '../../entities/user.entity';
import { JwtAuthGuard } from '../../libs/guards/auth.guard';
import { AiService } from './meal.ai.service';
import { AnalyzeMealPhotoDto } from './dto/analyze-meal-photo.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';

const memoryStorage = multer.memoryStorage();

@Controller('meals')
@UseGuards(JwtAuthGuard)
export class MealController {
  constructor(
    private readonly mealService: MealService,
    private readonly aiService: AiService,
  ) {}

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

  @Post('analyze')
  async analyze(@Body('text') text: string) {
    return this.aiService.analyzeTextMeal(text);
  }

  @UseInterceptors(FileInterceptor('photo', { storage: memoryStorage }))
  @Post('analyzePhoto')
  async analyzePhoto(
    @Body() body: AnalyzeMealPhotoDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.aiService.analyzePhotoMeal(body, file);
  }
}
