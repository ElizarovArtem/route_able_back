import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MealService } from './meal.service';
import { MealController } from './meal.controller';
import { Meal } from '../../entities/meal.entity';
import { Day } from '../../entities/day.entity';
import { DayModule } from '../day/day.module';
import { AiService } from './meal.ai.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([Meal, Day]), DayModule, ConfigModule],
  controllers: [MealController],
  providers: [MealService, AiService],
})
export class MealModule {}
