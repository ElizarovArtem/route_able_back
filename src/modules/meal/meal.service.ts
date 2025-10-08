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
    const meal = this.mealRepo.create({
      ...mealData,
      day,
      clientCoachId: day.clientCoachId ?? null,
    });
    return this.mealRepo.save(meal);
  }

  async getMealsSummaryForDay(date: string, user: User) {
    const qb = this.mealRepo
      .createQueryBuilder('m')
      .innerJoin('m.day', 'd')
      .where('d.userId = :uid AND d.date = :date', { uid: user.id, date })
      .orderBy('m.createdAt', 'ASC');

    const meals = await qb.getMany();

    const summary = meals.reduce(
      (acc, m) => {
        acc.calories += Number(m.calories);
        acc.protein += Number(m.protein);
        acc.fat += Number(m.fat);
        acc.carbs += Number(m.carbs);
        return acc;
      },
      { calories: 0, protein: 0, fat: 0, carbs: 0 },
    );

    return { date, summary, meals };
  }
}
