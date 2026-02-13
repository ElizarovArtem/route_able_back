import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { GigaChatService } from './gigachat.service';
import { CreateWorkoutPlanDto } from './dto/create-workout-plan.dto';
import { workoutPlanPrompt } from './prompts/workout-plan.prompt';
import { WorkoutSession } from '../../entities/workout-session.entity';
import { WorkoutExercise } from '../../entities/workout-exercise.entity';
import {
  WorkoutExerciseStatus,
  WorkoutStatus,
} from '../../config/emuns/ai-workout';
import { normalizeExerciseKeyFromAi } from '../../config/constants/ai-workout';
import { WorkoutHistoryItemDto } from './dto/workout-history.dto';

@Injectable()
export class WorkoutService {
  constructor(
    @InjectRepository(WorkoutSession)
    private readonly sessionsRepo: Repository<WorkoutSession>,
    @InjectRepository(WorkoutExercise)
    private readonly exercisesRepo: Repository<WorkoutExercise>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly gigaChat: GigaChatService,
    private readonly dataSource: DataSource,
  ) {}

  private today(): string {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  }

  // --- 1. Генерация плана на сегодня через GigaChat ---

  async createPlanForToday(userId: string, dto: CreateWorkoutPlanDto) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const prompt = workoutPlanPrompt({
      userName: user.name,
      weightGoal: user.weightGoal ?? null,
      intent: dto.intent ?? null,
      energyLevel: dto.energyLevel,
      sleepQuality: dto.sleepQuality,
      nutritionQuality: dto.nutritionQuality,
    });

    const raw = await this.gigaChat.chat({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      maxTokens: 800,
    });
    console.log(raw);
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('Failed to parse workout plan JSON from GigaChat');
    }

    const exercises = Array.isArray(parsed.exercises) ? parsed.exercises : [];
    if (!exercises.length) {
      throw new Error('Empty exercises list from GigaChat');
    }

    const session = this.sessionsRepo.create({
      userId,
      date: this.today(),
      status: WorkoutStatus.PLANNED,
      userIntent: dto.intent ?? null,
      energyLevel: dto.energyLevel,
      sleepQuality: dto.sleepQuality,
      nutritionQuality: dto.nutritionQuality,
      weightGoalSnapshot: user.weightGoal ?? null,
      modelRaw: parsed,
      currentExerciseIndex: 0,
      sourceSessionId: null,
      exercises: exercises.map((ex: any, idx: number) =>
        this.exercisesRepo.create({
          order: idx,
          name: ex.name,
          exerciseKey: normalizeExerciseKeyFromAi(ex.exerciseKey),
          targetMuscle: ex.targetMuscle ?? null,
          setsPlanned: ex.sets ?? 3,
          repsPerSet: ex.reps ?? 10,
          restSeconds: ex.restSeconds ?? 60,
          notes: ex.notes ?? null,
        }),
      ),
    });

    return this.sessionsRepo.save(session);
  }

  async getLastSessionByTemplate(userId: string, templateId: string) {
    const session = await this.sessionsRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.exercises', 'e')
      .where('s."userId" = :userId', { userId })
      .andWhere('(s.id = :templateId OR s."sourceSessionId" = :templateId)', {
        templateId,
      })
      .orderBy('s.date', 'DESC')
      .addOrderBy('s."createdAt"', 'DESC')
      .addOrderBy('e.order', 'ASC')
      .getOne();

    if (!session) throw new NotFoundException('Session not found for template');
    return session;
  }

  async getSession(userId: string, sessionId: string) {
    const session = await this.sessionsRepo.findOne({
      where: { id: sessionId, userId },
      relations: { exercises: true },
      order: { exercises: { order: 'ASC' } },
    });

    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  // --- 3. Начать тренировку ---

  async startSession(userId: string, sessionId: string) {
    const session = await this.getSession(userId, sessionId);

    if (session.status === WorkoutStatus.PLANNED) {
      session.status = WorkoutStatus.IN_PROGRESS;
      await this.sessionsRepo.save(session);
    }

    return session;
  }

  // --- 4. Подход выполнен ---

  async completeSet(userId: string, sessionId: string, exerciseId: string) {
    const session = await this.getSession(userId, sessionId);

    const exercise = session.exercises.find((e) => e.id === exerciseId);
    if (!exercise) throw new NotFoundException('Exercise not found');

    if (exercise.status === WorkoutExerciseStatus.PENDING) {
      exercise.status = WorkoutExerciseStatus.IN_PROGRESS;
    }

    exercise.setsCompleted += 1;

    if (exercise.setsCompleted >= exercise.setsPlanned) {
      exercise.status = WorkoutExerciseStatus.COMPLETED;
    }

    await this.exercisesRepo.save(exercise);

    const allDone = session.exercises.every(
      (e) => e.status === WorkoutExerciseStatus.COMPLETED,
    );
    if (allDone) {
      session.status = WorkoutStatus.COMPLETED;
      await this.sessionsRepo.save(session);
    }

    return exercise;
  }

  // --- 5. Выбрать текущее упражнение (для LiveKit) ---

  async setCurrentExercise(
    userId: string,
    sessionId: string,
    exerciseId: string,
  ) {
    const session = await this.getSession(userId, sessionId);

    const idx = session.exercises.findIndex((e) => e.id === exerciseId);
    if (idx === -1)
      throw new NotFoundException('Exercise not found in session');

    session.currentExerciseIndex = idx;
    await this.sessionsRepo.save(session);

    return session;
  }

  async listMyWorkoutTemplates(userId: string) {
    const templateExpr = `COALESCE(s."sourceSessionId", s.id)`;

    const groups = await this.sessionsRepo
      .createQueryBuilder('s')
      .select(templateExpr, 'templateId')
      .addSelect('COUNT(*)', 'timesPerformed')
      .addSelect('MAX(s.date)', 'lastDate')
      .where('s."userId" = :userId', { userId })
      .groupBy(templateExpr)
      .orderBy('MAX(s.date)', 'DESC')
      .getRawMany<{
        templateId: string;
        timesPerformed: string;
        lastDate: string;
      }>();

    const lastSessions = await this.sessionsRepo
      .createQueryBuilder('s')
      .select([
        `${templateExpr} as "templateId"`,
        `s.id as "lastSessionId"`,
        `s.date as "lastDate"`,
        `s.status as "lastStatus"`,
        `s."userIntent" as "userIntent"`,
      ])
      .where('s."userId" = :userId', { userId })
      .distinctOn([templateExpr])
      .orderBy(templateExpr, 'ASC')
      .addOrderBy('s.date', 'DESC')
      .addOrderBy('s."createdAt"', 'DESC')
      .getRawMany<{
        templateId: string;
        lastSessionId: string;
        lastDate: string;
        lastStatus: any;
        userIntent: string | null;
      }>();

    const lastByTemplateId = new Map(
      lastSessions.map((x) => [x.templateId, x]),
    );

    // ✅ 3) Одним запросом вытягиваем упражнения для всех lastSessionId
    const lastSessionIds = lastSessions.map((x) => x.lastSessionId);
    const exercisesBySessionId = new Map<string, any[]>();

    if (lastSessionIds.length) {
      const exercises = await this.exercisesRepo
        .createQueryBuilder('e')
        .select([
          'e.id as id',
          'e."sessionId" as "sessionId"',
          'e.order as order',
          'e.name as name',
          'e."exerciseKey" as "exerciseKey"',
          'e."setsPlanned" as "setsPlanned"',
          'e."repsPerSet" as "repsPerSet"',
          'e."restSeconds" as "restSeconds"',
          'e."targetMuscle" as "targetMuscle"',
          'e.notes as notes',
        ])
        .where('e."sessionId" IN (:...ids)', { ids: lastSessionIds })
        .orderBy('e.order', 'ASC')
        .getRawMany<{
          id: string;
          sessionId: string;
          order: number;
          name: string;
          exerciseKey: string | null;
          setsPlanned: number;
          repsPerSet: number;
          restSeconds: number | null;
          targetMuscle: string | null;
          notes: string | null;
        }>();

      for (const ex of exercises) {
        const arr = exercisesBySessionId.get(ex.sessionId) ?? [];
        arr.push(ex);
        exercisesBySessionId.set(ex.sessionId, arr);
      }
    }

    return groups.map((g) => {
      const last = lastByTemplateId.get(g.templateId);
      const lastSessionId = last?.lastSessionId ?? g.templateId;

      return {
        templateId: g.templateId,
        lastSessionId,
        lastDate: last?.lastDate ?? g.lastDate,
        lastStatus: last?.lastStatus ?? null,
        timesPerformed: Number(g.timesPerformed),
        userIntent: last?.userIntent ?? null,
        exercises: exercisesBySessionId.get(lastSessionId) ?? [],
      };
    });
  }

  async listMyWorkoutHistory(userId: string): Promise<WorkoutHistoryItemDto[]> {
    const rows = await this.sessionsRepo
      .createQueryBuilder('s')
      .select([
        's.id as id',
        's.date as date',
        's.status as status',
        's."sourceSessionId" as "sourceSessionId"',
        's."userIntent" as "userIntent"',
        's."createdAt" as "createdAt"',
        `COALESCE(s."sourceSessionId", s.id) as "templateId"`,
      ])
      .where('s."userId" = :userId', { userId })
      .orderBy('s.date', 'DESC')
      .addOrderBy('s."createdAt"', 'DESC')
      .getRawMany<WorkoutHistoryItemDto>();

    return rows;
  }

  async repeatSession(userId: string, sourceSessionId: string) {
    // 1. Находим исходную сессию пользователя
    const original = await this.sessionsRepo.findOne({
      where: { id: sourceSessionId, userId },
      relations: { exercises: true },
      order: { exercises: { order: 'ASC' } },
    });

    if (!original) throw new NotFoundException('Original session not found');

    // 2. При желании можно подтянуть актуальные цели пользователя
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // 3. Создаём НОВУЮ сессию на сегодня, с теми же упражнениями
    const newSession = this.sessionsRepo.create({
      userId,
      date: this.today(),
      status: WorkoutStatus.PLANNED,
      userIntent: original.userIntent,
      energyLevel: original.energyLevel,
      sleepQuality: original.sleepQuality,
      nutritionQuality: original.nutritionQuality,
      // можно взять либо старый snapshot, либо актуальную цель
      weightGoalSnapshot:
        user.weightGoal ?? original.weightGoalSnapshot ?? null,
      modelRaw: original.modelRaw, // можно и null, если не хочешь тянуть AI-ответ
      sourceSessionId: original.id,
      currentExerciseIndex: 0,
      exercises: original.exercises
        .sort((a, b) => a.order - b.order)
        .map((ex) =>
          this.exercisesRepo.create({
            order: ex.order,
            name: ex.name,
            exerciseKey: ex.exerciseKey ?? null,
            targetMuscle: ex.targetMuscle ?? null,
            setsPlanned: ex.setsPlanned,
            repsPerSet: ex.repsPerSet,
            restSeconds: ex.restSeconds ?? null,
            notes: ex.notes ?? null,
            setsCompleted: 0,
            status: WorkoutExerciseStatus.PENDING,
          }),
        ),
    });

    return this.sessionsRepo.save(newSession);
  }

  async deleteTemplate(userId: string, templateId: string) {
    // 1) Проверяем, что такая группа вообще существует у пользователя
    const exists = await this.sessionsRepo.exist({
      where: [
        { userId, id: templateId },
        { userId, sourceSessionId: templateId },
      ],
    });

    if (!exists) throw new NotFoundException('Template not found');

    // 3) Удаляем все сессии группы
    // Важно: используем delete() (быстро).
    // Для корректного удаления упражнений должен быть FK ON DELETE CASCADE в workout_exercises.
    const result = await this.sessionsRepo.delete([
      { userId, id: templateId },
      { userId, sourceSessionId: templateId },
    ]);

    return {
      templateId,
      deletedSessions: result.affected ?? 0,
    };
  }

  async deleteSession(userId: string, sessionId: string) {
    return this.dataSource.transaction(async (manager) => {
      const sessions = manager.getRepository(WorkoutSession);

      const session = await sessions.findOne({
        where: { id: sessionId, userId },
        select: [
          'id',
          'userId',
          'status',
          'sourceSessionId',
          'date',
          'createdAt',
        ],
      });

      if (!session) throw new NotFoundException('Session not found');

      // Если это повтор (не root) — просто удаляем и всё
      if (session.sourceSessionId) {
        const del = await sessions.delete({ id: session.id, userId });
        return {
          deletedSessionId: session.id,
          affectedSessions: del.affected ?? 0,
          reRooted: false,
        };
      }

      // Если это root — проверяем, есть ли повторы
      const repeats = await sessions.find({
        where: { userId, sourceSessionId: session.id },
        select: ['id', 'date', 'createdAt'],
        order: { date: 'DESC', createdAt: 'DESC' },
      });

      // Нет повторов — можно удалять root без последствий
      if (repeats.length === 0) {
        const del = await sessions.delete({ id: session.id, userId });
        return {
          deletedSessionId: session.id,
          affectedSessions: del.affected ?? 0,
          reRooted: false,
        };
      }

      // Есть повторы — назначаем новый root (самый свежий repeat)
      const newRoot = repeats[0];

      // 1) делаем newRoot корнем
      await sessions.update(
        { id: newRoot.id, userId },
        { sourceSessionId: null },
      );

      // 2) все остальные повторы переводим на нового корня
      const otherIds = repeats.slice(1).map((r) => r.id);
      if (otherIds.length) {
        await sessions
          .createQueryBuilder()
          .update(WorkoutSession)
          .set({ sourceSessionId: newRoot.id })
          .where('"userId" = :userId', { userId })
          .andWhere('id IN (:...ids)', { ids: otherIds })
          .execute();
      }

      // 3) удаляем старый root
      const del = await sessions.delete({ id: session.id, userId });

      return {
        deletedSessionId: session.id,
        affectedSessions: del.affected ?? 0,
        reRooted: true,
        newTemplateId: newRoot.id, // новый templateId группы
      };
    });
  }

  async continueSession(userId: string, sessionId: string) {
    const session = await this.sessionsRepo.findOne({
      where: { id: sessionId, userId },
      relations: { exercises: true },
      order: { exercises: { order: 'ASC' } },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.status === WorkoutStatus.CANCELED) {
      throw new NotFoundException('Session is canceled');
    }

    return session;
  }
}
