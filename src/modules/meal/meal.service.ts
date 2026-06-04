import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Meal } from '../../entities/meal.entity';
import { DayService } from '../day/day.service';
import { User } from '../../entities/user.entity';
import { CreateMealDto } from './dto/create-meal.dto';
import { ClientCoach } from '../../entities/client-coach.entity';
import { GigaChatService } from '../ai/gigachat.service';
import { AnalyzeMealPhotoDto } from './dto/analyze-meal-photo.dto';
import { SubscriptionAccessService } from '../subscriptions/subscription-access.service';
import { FeatureUsageService } from '../subscriptions/feature-usage.service';
import { PaidFeature } from '../../config/emuns/subscription';

@Injectable()
export class MealService {
  constructor(
    @InjectRepository(Meal)
    private readonly mealRepo: Repository<Meal>,
    @InjectRepository(ClientCoach)
    private readonly clientCoachRepo: Repository<ClientCoach>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly dayService: DayService,
    private readonly gigaChat: GigaChatService,
    private readonly subscriptionAccessService: SubscriptionAccessService,
    private readonly featureUsageService: FeatureUsageService,
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

  async getMealsSummaryForDay(date: string, userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

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

    // 🎯 ЛИЧНЫЕ ЦЕЛИ ПОЛЬЗОВАТЕЛЯ
    const hasPersonalGoals =
      user.personalGoalCalories != null ||
      user.personalGoalProtein != null ||
      user.personalGoalFat != null ||
      user.personalGoalCarbs != null;

    const personalGoals = hasPersonalGoals
      ? {
          calories: Number(user.personalGoalCalories) ?? null,
          protein: Number(user.personalGoalProtein) ?? null,
          fat: Number(user.personalGoalFat) ?? null,
          carbs: Number(user.personalGoalCarbs) ?? null,
        }
      : null;

    // 🎯 ЦЕЛИ ТРЕНЕРОВ (МОЖЕТ БЫТЬ НЕСКОЛЬКО)
    const relations = await this.clientCoachRepo.find({
      where: { clientId: user.id, isActive: true },
      relations: { coach: true },
    });

    const coachGoals = relations
      .map((rel) => {
        const hasGoals =
          rel.goalCalories != null ||
          rel.goalProtein != null ||
          rel.goalFat != null ||
          rel.goalCarbs != null;

        if (!hasGoals) return null;

        return {
          clientCoachId: rel.id,
          coachId: rel.coachId,
          coachName: rel.coach?.name ?? null,
          calories: Number(rel.goalCalories) ?? null,
          protein: Number(rel.goalProtein) ?? null,
          fat: Number(rel.goalFat) ?? null,
          carbs: Number(rel.goalCarbs) ?? null,
        };
      })
      .filter((g) => g !== null);

    return {
      date,
      summary,
      meals,
      goals: {
        personal: personalGoals,
        coaches: coachGoals as {
          clientCoachId: string;
          coachId: string;
          coachName: string | null;
          calories: number | null;
          protein: number | null;
          fat: number | null;
          carbs: number | null;
        }[],
      },
    };
  }

  async analyzeTextMeal(text: string, userId: string) {
    await this.subscriptionAccessService.assertCanUseFeature(
      userId,
      PaidFeature.AI_FOOD_LOGGING,
    );

    const prompt = `
      Ты — нутрициолог. На основе описания еды оцени примерное количество калорий, белков, жиров и углеводов.
      Верни ТОЛЬКО JSON следующего вида:
      
      {
        "name": string,
        "calories": number,
        "protein": number,
        "fat": number,
        "carbs": number
      }
      
      Никакого дополнительного текста. Только JSON.
      Описание: ${text}
      `;

    try {
      const content = await this.gigaChat.chat({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      const jsonMatch = content.match(/\{[\s\S]*?\}/);
      const json = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      if (!json) {
        throw new Error('Невозможно разобрать JSON');
      }

      const limit = await this.subscriptionAccessService.getFeatureLimit(
        userId,
        PaidFeature.AI_FOOD_LOGGING,
      );
      await this.featureUsageService.consume(
        userId,
        PaidFeature.AI_FOOD_LOGGING,
        limit,
      );

      return json;
    } catch (error) {
      console.error('GigaChat error:', error?.response?.data || error.message);
      throw new InternalServerErrorException(
        'GigaChat не смог обработать запрос',
      );
    }
  }

  async analyzePhotoMeal(
    { weight }: AnalyzeMealPhotoDto,
    photo: Express.Multer.File,
    userId: string,
  ) {
    await this.subscriptionAccessService.assertCanUseFeature(
      userId,
      PaidFeature.AI_PHOTO_ANALYSIS,
    );

    try {
      const prompt = `
      Ты — нутрициолог. На основе изображения блюда и данных ниже оцени БЖУ и калории.
      Учитывай вес (в граммах), масштабируй значения пропорционально.
      
      Данные:
      - Вес (граммы): ${weight}
      
      Верни ТОЛЬКО JSON без лишнего текста:
      {
        "name": string,      // название блюда/продукта
        "calories": number,  // ккал на весь объём
        "protein": number,   // граммы белка
        "fat": number,       // граммы жира
        "carbs": number      // граммы углеводов
      }
      `.trim();

      const content = await this.gigaChat.chatWithImage({
        prompt,
        file: photo,
      });

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('JSON not found in model response');

      const result = JSON.parse(jsonMatch[0]);
      const limit = await this.subscriptionAccessService.getFeatureLimit(
        userId,
        PaidFeature.AI_PHOTO_ANALYSIS,
      );
      await this.featureUsageService.consume(
        userId,
        PaidFeature.AI_PHOTO_ANALYSIS,
        limit,
      );

      return result;
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException(`GigaChat Vision error: ${e}`);
    }
  }
}
