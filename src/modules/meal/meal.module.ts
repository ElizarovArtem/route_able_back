import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MealService } from './meal.service';
import { MealController } from './meal.controller';
import { Meal } from '../../entities/meal.entity';
import { Day } from '../../entities/day.entity';
import { DayModule } from '../day/day.module';
import { ConfigModule } from '@nestjs/config';
import { ClientCoach } from '../../entities/client-coach.entity';
import { User } from '../../entities/user.entity';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Meal, Day, ClientCoach, User]),
    DayModule,
    ConfigModule,
    AiModule,
  ],
  controllers: [MealController],
  providers: [MealService],
  exports: [MealService],
})
export class MealModule {}
