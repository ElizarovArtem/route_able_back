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
import { CreatePlannedMealDto } from './dto/create-planned-meal';

@Injectable()
export class PlannedMealsService {
  constructor(
    @InjectRepository(PlannedMeal) private plannedRepo: Repository<PlannedMeal>,
    @InjectRepository(Meal) private mealRepo: Repository<Meal>,
    @InjectRepository(ClientCoach) private linksRepo: Repository<ClientCoach>,
    @InjectRepository(Day) private dayRepo: Repository<Day>,
  ) {}

  private async loadLinkForUser(meId: string, relationId: string) {
    const link = await this.linksRepo.findOne({ where: { id: relationId } });
    if (!link || (meId !== link.clientId && meId !== link.coachId)) {
      throw new NotFoundException('Связь не найдена');
    }
    return link;
  }

  private assertCoachAccess(meId: string, link: ClientCoach) {
    if (meId !== link.coachId) {
      throw new ForbiddenException('Только тренер может назначать приёмы');
    }
  }

  private assertClientAccess(meId: string, link: ClientCoach) {
    if (meId !== link.clientId) {
      throw new ForbiddenException('Только клиент может отмечать');
    }
  }

  private async loadPlannedMealForLink(
    clientCoachId: string,
    plannedMealId: string,
    repo: Repository<PlannedMeal> = this.plannedRepo,
  ) {
    const plannedMeal = await repo.findOne({
      where: { id: plannedMealId },
    });
    if (!plannedMeal || plannedMeal.clientCoachId !== clientCoachId) {
      throw new NotFoundException('План не найден');
    }
    return plannedMeal;
  }

  private clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
  }

  // Тренер создаёт плановый приём пищи
  async create(meId: string, relationId: string, dto: CreatePlannedMealDto) {
    const link = await this.loadLinkForUser(meId, relationId);
    this.assertCoachAccess(meId, link);
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
    const link = await this.loadLinkForUser(meId, relationId);
    const effectiveLimit = this.clamp(limit, 1, 500);
    return this.plannedRepo.find({
      where: { clientCoachId: link.id, date },
      order: { createdAt: 'ASC' },
      take: effectiveLimit,
    });
  }

  // Клиент нажимает «Съел» — создаём факт и помечаем план выполненным (идемпотентно)
  async consume(meId: string, relationId: string, plannedMealId: string) {
    const link = await this.loadLinkForUser(meId, relationId);
    this.assertClientAccess(meId, link);

    return this.plannedRepo.manager.transaction(async (manager) => {
      const plannedRepo = manager.getRepository(PlannedMeal);
      const mealRepo = manager.getRepository(Meal);
      const dayRepo = manager.getRepository(Day);

      const plannedMeal = await this.loadPlannedMealForLink(
        link.id,
        plannedMealId,
        plannedRepo,
      );

      const existed = await mealRepo.findOne({
        where: { plannedMealId: plannedMeal.id },
      });
      if (existed) {
        return { planned: plannedMeal, meal: existed };
      }

      let day = await dayRepo.findOne({
        where: {
          userId: link.clientId,
          clientCoachId: link.id,
          date: plannedMeal.date,
        },
      });
      if (!day) {
        day = await dayRepo.save(
          dayRepo.create({
            userId: link.clientId,
            clientCoachId: link.id,
            date: plannedMeal.date,
          }),
        );
      }

      const meal = mealRepo.create({
        day,
        clientCoachId: link.id,
        plannedMealId: plannedMeal.id,
        name: plannedMeal.text,
        calories: plannedMeal.calories ?? 0,
        protein: plannedMeal.protein ?? 0,
        fat: plannedMeal.fat ?? 0,
        carbs: plannedMeal.carbs ?? 0,
      });
      const savedMeal = await mealRepo.save(meal);

      await plannedRepo.update(plannedMeal.id, {
        isCompleted: true,
        completedAt: new Date(),
      });
      const refreshedPlanned = await plannedRepo.findOne({
        where: { id: plannedMeal.id },
      });

      return { planned: refreshedPlanned ?? plannedMeal, meal: savedMeal };
    });
  }

  async remove(meId: string, relationId: string, plannedMealId: string) {
    const link = await this.loadLinkForUser(meId, relationId);
    this.assertCoachAccess(meId, link);

    const plannedMeal = await this.loadPlannedMealForLink(
      link.id,
      plannedMealId,
    );

    const hasFact = await this.mealRepo.exist({
      where: { plannedMealId: plannedMeal.id },
    });
    if (plannedMeal.isCompleted || hasFact) {
      throw new ConflictException(
        'Нельзя удалить: приём уже отмечен как съеденный',
      );
    }

    await this.plannedRepo.delete({
      id: plannedMeal.id,
      clientCoachId: link.id,
    });
    return { ok: true };
  }
}
