import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MealService } from './meal.service';
import { MealController } from './meal.controller';
import { Meal } from '../../entities/meal.entity';
import { Day } from '../../entities/day.entity';
import { DayModule } from '../day/day.module';

@Module({
  imports: [TypeOrmModule.forFeature([Meal, Day]), DayModule],
  controllers: [MealController],
  providers: [MealService],
})
export class MealModule {}
