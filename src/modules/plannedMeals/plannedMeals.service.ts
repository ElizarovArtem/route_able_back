import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientCoach } from '../../entities/client-coach.entity';
import { PlannedMeal } from '../../entities/planned-meal.entity';
import { Meal } from '../../entities/meal.entity';
import { Day } from '../../entities/day.entity';

@Injectable()
export class PlannedMealsService {
  constructor(
    @InjectRepository(PlannedMeal) private plannedRepo: Repository<PlannedMeal>,
    @InjectRepository(Meal) private mealRepo: Repository<Meal>,
    @InjectRepository(ClientCoach) private linksRepo: Repository<ClientCoach>,
    @InjectRepository(Day) private dayRepo: Repository<Day>,
  ) {}

  private async getLink(meId: string, relationId: string) {
    const link = await this.linksRepo.findOne({ where: { id: relationId } });
    if (!link) throw new NotFoundException('Связь не найдена');
    if (meId !== link.clientId && meId !== link.coachId) {
      // privacy-friendly: не палим чужие связи
      throw new NotFoundException('Связь не найдена');
    }
    return link;
  }

  // Тренер создаёт плановый приём пищи
  async create(
    meId: string,
    relationId: string,
    dto: {
      text: string;
      date: string; // YYYY-MM-DD
      calories?: number;
      protein?: number;
      fat?: number;
      carbs?: number;
    },
  ) {
    const link = await this.getLink(meId, relationId);
    if (meId !== link.coachId) {
      throw new ForbiddenException('Только тренер может назначать приёмы');
    }
    // если нужен paywall: if (!link.isActive) throw new ForbiddenException('Связь не активна');

    const entry = this.plannedRepo.create({
      clientCoachId: link.id,
      clientId: link.clientId,
      coachId: link.coachId,
      authorId: meId,
      text: dto.text,
      date: dto.date,
      calories: dto.calories ?? null,
      protein: dto.protein ?? null,
      fat: dto.fat ?? null,
      carbs: dto.carbs ?? null,
      // isCompleted по умолчанию false (в entity default)
    });

    return this.plannedRepo.save(entry);
  }

  // Список плановых приёмов на дату (видят оба участника)
  async listForDate(
    meId: string,
    relationId: string,
    date: string,
    limit = 100,
  ) {
    const link = await this.getLink(meId, relationId);
    return this.plannedRepo.find({
      where: { clientCoachId: link.id, date },
      order: { createdAt: 'ASC' },
      take: Math.min(Math.max(limit, 1), 500),
    });
  }

  // Клиент нажимает «Съел» — создаём факт и помечаем план выполненным (идемпотентно)
  async consume(meId: string, relationId: string, plannedMealId: string) {
    const link = await this.getLink(meId, relationId);
    if (meId !== link.clientId) {
      throw new ForbiddenException('Только клиент может отмечать');
    }

    const plannedMeal = await this.plannedRepo.findOne({
      where: { id: plannedMealId },
    });
    if (!plannedMeal || plannedMeal.clientCoachId !== link.id) {
      throw new NotFoundException('План не найден');
    }

    // если факт уже есть — вернём его (идемпотентность по UNIQUE(plannedMealId))
    const existed = await this.mealRepo.findOne({
      where: { plannedMealId: plannedMeal.id },
    });
    if (existed) return { planned: plannedMeal, meal: existed };

    // найти/создать Day для пары на эту дату (если используешь Day)
    let day = await this.dayRepo.findOne({
      where: {
        userId: link.clientId,
        clientCoachId: link.id,
        date: plannedMeal.date,
      },
    });
    if (!day) {
      day = await this.dayRepo.save(
        this.dayRepo.create({
          userId: link.clientId,
          clientCoachId: link.id,
          date: plannedMeal.date,
        }),
      );
    }

    // создать факт (Meal) — идёт в дневную калорийность
    const meal = this.mealRepo.create({
      day,
      clientCoachId: link.id,
      plannedMealId: plannedMeal.id,
      name: plannedMeal.text,
      calories: plannedMeal.calories ?? 0,
      protein: plannedMeal.protein ?? 0,
      fat: plannedMeal.fat ?? 0,
      carbs: plannedMeal.carbs ?? 0,
    });
    const savedMeal = await this.mealRepo.save(meal);

    // пометить план выполненным
    plannedMeal.isCompleted = true;
    plannedMeal.completedAt = new Date();
    await this.plannedRepo.save(plannedMeal);

    return { planned: plannedMeal, meal: savedMeal };
  }

  async remove(meId: string, relationId: string, plannedMealId: string) {
    const link = await this.getLink(meId, relationId);
    if (meId !== link.coachId) {
      throw new ForbiddenException('Удалять может только тренер');
    }

    const plannedMeal = await this.plannedRepo.findOne({
      where: { id: plannedMealId },
    });
    if (!plannedMeal || plannedMeal.clientCoachId !== link.id) {
      throw new NotFoundException('План не найден');
    }

    // если уже выполнен — запрещаем
    if (plannedMeal.isCompleted) {
      throw new ConflictException(
        'Нельзя удалить: приём уже отмечен как съеденный',
      );
    }

    // если есть связанный факт в meals — тоже запрещаем (на всякий случай)
    const hasFact = await this.mealRepo.exist({
      where: { plannedMealId: plannedMeal.id },
    });
    if (hasFact) {
      throw new ConflictException(
        'Нельзя удалить: уже создан факт потребления',
      );
    }

    await this.plannedRepo.delete({
      id: plannedMeal.id,
      clientCoachId: link.id,
    });
    return { ok: true };
  }
}
