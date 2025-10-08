import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlannedExercise } from '../../entities/planned-exercise.entity';
import { ClientCoach } from '../../entities/client-coach.entity';
import { CreatePlannedExerciseDto } from './dto/create-planned-exercise.dto';
import { ExerciseLog } from '../../entities/exercise-log.entity';

@Injectable()
export class PlannedExercisesService {
  constructor(
    @InjectRepository(PlannedExercise)
    private planned: Repository<PlannedExercise>,
    @InjectRepository(ClientCoach)
    private links: Repository<ClientCoach>,
    @InjectRepository(ExerciseLog)
    private logs: Repository<ExerciseLog>,
  ) {}

  private async requireMembership(meId: string, relationId: string) {
    const link = await this.links.findOne({ where: { id: relationId } });
    if (!link) throw new NotFoundException('Связь не найдена');
    if (meId !== link.clientId && meId !== link.coachId) {
      throw new NotFoundException('Связь не найдена');
    }
    return link;
  }

  // ✅ Тренер добавляет ОДНО упражнение на конкретный день
  async addExercise(
    meId: string,
    relationId: string,
    dto: CreatePlannedExerciseDto,
  ) {
    const link = await this.requireMembership(meId, relationId);
    if (meId !== link.coachId)
      throw new ForbiddenException('Только тренер может назначать тренировку');
    // если требуется активная оплата:
    // if (!link.isActive) throw new ForbiddenException('Связь не активна');

    // если order не передали — ставим в конец списка на этот день
    let order = dto.order;
    if (order == null) {
      const { max } = await this.planned
        .createQueryBuilder('e')
        .select('MAX(e.order)', 'max')
        .where('e.clientCoachId = :id AND e.date = :date', {
          id: link.id,
          date: dto.date,
        })
        .getRawOne<{ max: number | null }>();
      order = (max ?? 0) + 1;
    }

    const row = this.planned.create({
      clientCoachId: link.id,
      clientId: link.clientId,
      coachId: link.coachId,
      authorId: meId,
      date: dto.date,
      name: dto.name.trim(),
      sets: dto.sets,
      reps: dto.reps,
      order,
      notes: dto.notes ?? null,
      workingWeight: dto.workingWeight ?? null,
    });

    return this.planned.save(row);
  }

  // как и было: получить список упражнений на дату
  async listForDate(
    meId: string,
    relationId: string,
    date: string,
    limit = 200,
  ) {
    const link = await this.requireMembership(meId, relationId);

    const rows = await this.planned
      .createQueryBuilder('e')
      .leftJoin(ExerciseLog, 'l', 'l."plannedExerciseId" = e.id')
      .where('e."clientCoachId" = :cid AND e.date = :date', {
        cid: link.id,
        date,
      })
      .select([
        'e.id AS id',
        'e.name AS name',
        'e.sets AS sets',
        'e.reps AS reps',
        'e.order AS "order"',
        'e.notes AS notes',
        'e.date AS date',
        'e.workingWeight AS "workingWeight"',
        'l.id AS "logId"',
        'l."createdAt" AS "completedAt"',
      ])
      .orderBy('e."order"', 'ASC')
      .addOrderBy('e."createdAt"', 'ASC')
      .limit(Math.min(Math.max(+limit || 200, 1), 1000))
      .getRawMany<{
        id: string;
        name: string;
        sets: number;
        reps: number;
        order: number | null;
        notes: string | null;
        date: string;
        logId: string | null;
        completedAt: Date | null;
        workingWeight: string | null;
      }>();

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      sets: r.sets,
      reps: r.reps,
      order: r.order,
      notes: r.notes,
      date: r.date,
      completed: !!r.logId,
      workingWeight: r.workingWeight ? Number(r.workingWeight) : null,
      completedAt: r.completedAt ?? null,
      logId: r.logId ?? null,
    }));
  }

  // клиент отмечает «выполнено» (без тела), идемпотентно
  async completeExercise(
    meId: string,
    relationId: string,
    plannedExerciseId: string,
  ) {
    const link = await this.requireMembership(meId, relationId);
    if (meId !== link.clientId)
      throw new ForbiddenException('Только клиент может отмечать выполнение');

    const ex = await this.planned.findOne({ where: { id: plannedExerciseId } });
    if (!ex || ex.clientCoachId !== link.id)
      throw new NotFoundException('Упражнение не найдено');

    // если уже есть лог — вернуть его (идемпотентность)
    let log = await this.logs.findOne({ where: { plannedExerciseId: ex.id } });
    if (log) return { plannedExerciseId: ex.id, log };

    log = this.logs.create({
      clientCoachId: link.id,
      clientId: link.clientId,
      coachId: link.coachId,
      plannedExerciseId: ex.id,
      authorId: meId,
    });
    log = await this.logs.save(log);
    return { plannedExerciseId: ex.id, log };
  }

  // удалить плановое упражнение (только тренер)
  async deletePlannedExercise(
    meId: string,
    relationId: string,
    plannedExerciseId: string,
  ) {
    const link = await this.requireMembership(meId, relationId);
    if (meId !== link.coachId)
      throw new ForbiddenException('Удалять может только тренер');

    const ex = await this.planned.findOne({ where: { id: plannedExerciseId } });
    if (!ex || ex.clientCoachId !== link.id)
      throw new NotFoundException('Упражнение не найдено');

    await this.planned.delete({
      id: plannedExerciseId,
      clientCoachId: link.id,
    });
    return { ok: true };
  }
}
