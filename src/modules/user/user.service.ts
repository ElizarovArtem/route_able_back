import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../../entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { ActivityLevel, Roles, WeightGoal } from '../../config/emuns/user';
import { UpdatePersonalGoalsDto } from './dto/update-personal-goals.dto';
import { CalcCaloriesDto } from './dto/analyze-tdee.dto';
import { GigaChatService } from '../ai/gigachat.service';
import { CoachListItem } from '../../config/interfaces/user';
import { CoachProfile } from 'src/entities/coach-profile.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly gigaChat: GigaChatService,
  ) {}

  private getAgeFromBirthDate(birthDate: string): number {
    const today = new Date();
    const dob = new Date(birthDate);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  private getActivityFactor(level: ActivityLevel): number {
    switch (level) {
      case ActivityLevel.SEDENTARY:
        return 1.2;
      case ActivityLevel.LIGHT:
        return 1.375;
      case ActivityLevel.MODERATE:
        return 1.55;
      case ActivityLevel.ACTIVE:
        return 1.725;
      case ActivityLevel.VERY_ACTIVE:
        return 1.9;
      default:
        return 1.2;
    }
  }

  private getGoalFactor(goal: WeightGoal): number {
    switch (goal) {
      case WeightGoal.LOSE:
        return 0.8; // -20%
      case WeightGoal.GAIN:
        return 1.15; // +15%
      case WeightGoal.MAINTAIN:
      default:
        return 1.0;
    }
  }

  create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);

    return this.userRepository.save(user);
  }

  findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  findOne(phone: string): Promise<User | null> {
    return this.userRepository.findOneBy({ phone });
  }

  findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }

  findOneByPhoneOrEmail(value: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: [{ phone: value }, { email: value }],
    });
  }

  getById(id: string): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  async getCoaches(currentUserId?: string): Promise<CoachListItem[]> {
    const qb = this.userRepository
      .createQueryBuilder('u')
      .leftJoin(CoachProfile, 'cp', 'cp."userId" = u.id')
      .where(':role = ANY(u.roles)', { role: Roles.Coach });

    if (currentUserId) {
      qb.andWhere('u.id <> :me', { me: currentUserId });
    }

    const rows = await qb
      .select([
        'u.id as id',
        'u.name as name',
        'u.about as about',
        'u.avatar as avatar',
        'COALESCE(cp."ratingAvg", 0) as "ratingAvg"',
        'COALESCE(cp."ratingCount", 0) as "ratingCount"',
      ])
      .orderBy('cp."ratingAvg"', 'DESC', 'NULLS LAST')
      .addOrderBy('cp."ratingCount"', 'DESC')
      .addOrderBy('u.createdAt', 'DESC')
      .getRawMany();

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      about: row.about,
      avatar: row.avatar,
      rating: {
        avg: Number(row.ratingAvg ?? 0),
        count: Number(row.ratingCount ?? 0),
      },
    }));
  }

  async updateUser(
    user: User,
    { isCoach, ...dto }: UpdateUserDto,
    avatarUrl?: string,
  ) {
    let updateData: Partial<User> = { ...dto, roles: user.roles };

    if (avatarUrl) {
      updateData = { ...updateData, avatar: avatarUrl };
    }

    if (isCoach === 'true' && !user.roles.includes(Roles.Coach)) {
      updateData = { ...updateData, roles: [...updateData.roles, Roles.Coach] };
    } else {
      updateData = {
        ...updateData,
        roles: updateData.roles.filter((role) => role !== Roles.Coach),
      };
    }

    await this.userRepository.update({ id: user.id }, updateData);

    return this.userRepository.findOne({ where: { id: user.id } });
  }

  async updatePersonalGoals(userId: string, dto: UpdatePersonalGoalsDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Обновляем только переданные поля (partial update)
    if (dto.calories !== undefined) {
      user.personalGoalCalories = dto.calories;
    }
    if (dto.protein !== undefined) {
      user.personalGoalProtein = dto.protein;
    }
    if (dto.fat !== undefined) {
      user.personalGoalFat = dto.fat;
    }
    if (dto.carbs !== undefined) {
      user.personalGoalCarbs = dto.carbs;
    }

    await this.userRepository.save(user);

    return {
      personal: {
        calories:
          user.personalGoalCalories != null
            ? Number(user.personalGoalCalories)
            : null,
        protein:
          user.personalGoalProtein != null
            ? Number(user.personalGoalProtein)
            : null,
        fat: user.personalGoalFat != null ? Number(user.personalGoalFat) : null,
        carbs:
          user.personalGoalCarbs != null
            ? Number(user.personalGoalCarbs)
            : null,
      },
    };
  }

  async updateBodyAndCalcCalories(userId: string, dto: CalcCaloriesDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 1. Сохраняем параметры тела в пользователя
    user.weight = dto.weight;
    user.height = dto.height;
    user.gender = dto.gender;
    user.birthDate = dto.birthDate;
    user.activityLevel = dto.activityLevel;
    user.weightGoal = dto.weightGoal;
    user.bodyFatPercent =
      dto.bodyFatPercent !== undefined ? dto.bodyFatPercent : null;

    const age = this.getAgeFromBirthDate(dto.birthDate);

    if (!Number.isFinite(age) || age <= 0) {
      throw new BadRequestException('Invalid birthDate for age calculation');
    }

    const weight = dto.weight;
    const height = dto.height;

    // 2. Считаем BMR
    let bmr: number;

    if (dto.bodyFatPercent != null) {
      // Формула Katch–McArdle по сухой массе
      const lbm = weight * (1 - dto.bodyFatPercent / 100);
      bmr = 370 + 21.6 * lbm;
    } else {
      // Формула Mifflin–St Jeor
      if (!dto.gender) {
        throw new BadRequestException('Gender is required for BMR calculation');
      }

      if (dto.gender === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
      } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
      }
    }

    // 3. TDEE с учётом активности
    const activityFactor = this.getActivityFactor(dto.activityLevel);
    const tdee = bmr * activityFactor;

    // 4. Целевые калории с учётом цели
    const goalFactor = this.getGoalFactor(dto.weightGoal);
    const targetCalories = Math.round(tdee * goalFactor);

    // 5. Сохраняем рекомендованные калории как личную цель
    user.personalGoalCalories = targetCalories;

    const proteinGrams = Math.round(user.weight * 1.8);
    const proteinCalories = proteinGrams * 4;

    const fatCalories = Math.round(targetCalories * 0.28);
    const fatGrams = Math.round(fatCalories / 9);

    const carbCalories = targetCalories - (proteinCalories + fatCalories);
    const carbGrams = Math.round(carbCalories / 4);

    user.personalGoalCalories = targetCalories;
    user.personalGoalProtein = proteinGrams;
    user.personalGoalFat = fatGrams;
    user.personalGoalCarbs = carbGrams;

    await this.userRepository.save(user);

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      targetCalories: targetCalories,
      protein: proteinGrams,
      fat: fatGrams,
      carbs: carbGrams,
      savedGoals: {
        calories: targetCalories,
      },
      savedBody: {
        weight: user.weight,
        height: user.height,
        gender: user.gender,
        birthDate: user.birthDate,
        activityLevel: user.activityLevel,
        weightGoal: user.weightGoal,
        bodyFatPercent: user.bodyFatPercent,
      },
    };
  }

  async analyzeBodyFatByPhoto(photo: Express.Multer.File) {
    const prompt = `
      Ты — ассистент, который делает ориентировочную визуальную оценку процента жира в теле человека по фотографии.

      Выполни анализ по следующим правилам:
      
      1. Определи примерный процент жира в теле (body fat %) человека на фото.
      2. Используй своё визуальное восприятие: выраженность мышц, складки кожи, распределение жира на животе, боках, груди, руках и бёдрах.
      3. Не используй медицинских терминов и не делай выводов о здоровье.
      4. Учитывай, что точность низкая, поэтому дай одно число — ориентировочный процент, который соответствует середине предполагаемого диапазона.
         Пример: если модель думает, что диапазон мог быть 18–22%, то итог должен быть 20.
      5. Ответ должен содержать **только число** (например: \`21\`), без текста, без единиц измерения, без комментариев.
      
      Если данных для оценки недостаточно, верни \`null\`.
      `.trim();

    const raw = await this.gigaChat.chatWithImage({
      prompt,
      file: photo,
      temperature: 0.2,
      maxTokens: 50,
    });

    const trimmed = raw.trim();
    const num = Number(trimmed);
    if (!Number.isFinite(num)) {
      return null;
    }
    return num;
  }
}
