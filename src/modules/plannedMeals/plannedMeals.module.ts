import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlannedMeal } from '../../entities/planned-meal.entity';
import { ClientCoach } from '../../entities/client-coach.entity';
import { PlannedMealsService } from './plannedMeals.service';
import { PlannedMealsController } from './plannedMeals.controller';
import { Meal } from '../../entities/meal.entity';
import { Day } from '../../entities/day.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlannedMeal, ClientCoach, Meal, Day])],
  providers: [PlannedMealsService],
  controllers: [PlannedMealsController],
})
export class PlannedMealsModule {}
