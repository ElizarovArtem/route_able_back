import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Meal } from '../../entities/meal.entity';
import { DayService } from '../day/day.service';
import { User } from '../../entities/user.entity';
import { CreateMealDto } from './dto/create-meal.dto';

@Injectable()
export class MealService {
  constructor(
    @InjectRepository(Meal)
    private readonly mealRepo: Repository<Meal>,
    private readonly dayService: DayService,
  ) {}

  async addMeal(dto: CreateMealDto, user: User): Promise<Meal> {
    const { date, ...mealData } = dto;
    const day = await this.dayService.getOrCreateDay(user, date);
    const meal = this.mealRepo.create({ ...mealData, day });
    return this.mealRepo.save(meal);
  }

  async getMealsSummaryForDay(date: string, user: User) {
    const meals = await this.mealRepo.find({
      where: {
        day: {
          date,
          user: { id: user.id },
        },
      },
      relations: ['day'],
      order: {
        createdAt: 'ASC',
      },
    });

    const summary = meals.reduce(
      (acc, meal) => {
        acc.calories += Number(meal.calories);
        acc.protein += Number(meal.protein);
        acc.fat += Number(meal.fat);
        acc.carbs += Number(meal.carbs);
        return acc;
      },
      { calories: 0, protein: 0, fat: 0, carbs: 0 },
    );

    return {
      date,
      summary,
      meals,
    };
  }
}
