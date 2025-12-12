import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, Raw, Between, In, DataSource } from 'typeorm';
import { VideoLesson, LessonStatus } from '../../entities/video-lesson.entity';
import { ClientCoachService } from '../clientCoach/clientCoach.service';
import { TimeSlot, TimeSlotStatus } from '../../entities/time-slot.entity';

@Injectable()
export class VideoLessonsService implements OnModuleInit, OnModuleDestroy {
  private earlyJoinMin = 5;
  private lateJoinMin = 10;
  private readonly statusSyncIntervalMs = 60_000;
  private readonly statusSyncLookbackMs = 6 * 60 * 60_000; // 6 hours
  private readonly logger = new Logger(VideoLessonsService.name);
  private statusSyncTimer: NodeJS.Timeout | null = null;
  private statusSyncRunning = false;

  constructor(
    @InjectRepository(VideoLesson)
    private readonly lessons: Repository<VideoLesson>,
    private readonly clientCoachService: ClientCoachService,
    private readonly dataSource: DataSource,
  ) {}

  private getDayRange(date: string): { from: Date; to: Date } {
    // простой вариант: считаем, что дата в UTC, как и слоты
    const from = new Date(`${date}T00:00:00.000Z`);
    const to = new Date(`${date}T23:59:59.999Z`);
    return { from, to };
  }

  onModuleInit() {
    this.statusSyncTimer = setInterval(() => {
      void this.runStatusSync();
    }, this.statusSyncIntervalMs);
    void this.runStatusSync();
  }

  onModuleDestroy() {
    if (this.statusSyncTimer) {
      clearInterval(this.statusSyncTimer);
      this.statusSyncTimer = null;
    }
  }

  private async runStatusSync() {
    if (this.statusSyncRunning) return;
    this.statusSyncRunning = true;
    try {
      await this.syncStatuses();
    } catch (err) {
      this.logger.error(
        'Failed to sync video lesson statuses',
        err instanceof Error ? err.stack : String(err),
      );
    } finally {
      this.statusSyncRunning = false;
    }
  }

  private toDate(s: string) {
    const d = new Date(s);
    if (Number.isNaN(+d)) throw new BadRequestException('Invalid date');
    return d;
  }

  async create(
    meId: string,
    relationId: string,
    dto: { startAt: string; endAt: string; title?: string; notes?: string },
  ) {
    const link = await this.clientCoachService.requireActiveByRelationId(
      meId,
      relationId,
    );
    const startAt = this.toDate(dto.startAt);
    const endAt = this.toDate(dto.endAt);
    if (endAt <= startAt)
      throw new BadRequestException('endAt must be after startAt');

    const overlap = await this.lessons.exist({
      where: [
        {
          clientId: link.clientId,
          status: Not(LessonStatus.CANCELED),
          startAt: Raw((a) => `${a} < :endAt`, { endAt }),
          endAt: Raw((a) => `${a} > :startAt`, { startAt }),
        },
        {
          coachId: link.coachId,
          status: Not(LessonStatus.CANCELED),
          startAt: Raw((a) => `${a} < :endAt`, { endAt }),
          endAt: Raw((a) => `${a} > :startAt`, { startAt }),
        },
      ],
    });
    if (overlap)
      throw new BadRequestException('Time overlaps with another lesson');

    const row = this.lessons.create({
      clientCoachId: link.id,
      clientId: link.clientId,
      coachId: link.coachId,
      startAt,
      endAt,
      title: dto.title ?? null,
      notes: dto.notes ?? null,
      createdBy: meId,
      status: LessonStatus.SCHEDULED,
    });
    return this.lessons.save(row);
  }

  async list(meId: string, relationId: string) {
    const link = await this.clientCoachService.requireMembershipByRelationId(
      meId,
      relationId,
    );
    return this.lessons.find({
      where: {
        clientCoachId: link.id,
        status: Not(In([LessonStatus.CANCELED, LessonStatus.COMPLETED])),
      },
      order: { startAt: 'ASC' },
    });
  }

  async cancel(userId: string, lessonId: string) {
    return this.dataSource.transaction(async (manager) => {
      // 1. Находим урок и лочим только ЕГО
      const lesson = await manager.findOne(VideoLesson, {
        where: { id: lessonId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!lesson) {
        throw new NotFoundException('Lesson not found');
      }

      // проверка: только клиент (или тренер — по желанию)
      if (lesson.clientId !== userId /* && lesson.coachId !== userId */) {
        throw new ForbiddenException('You cannot cancel this lesson');
      }

      if (
        lesson.status !== LessonStatus.SCHEDULED &&
        lesson.status !== LessonStatus.IN_PROGRESS
      ) {
        throw new BadRequestException('Lesson cannot be canceled');
      }

      // 2. Отмечаем урок как отменённый
      lesson.status = LessonStatus.CANCELED;
      await manager.save(lesson);

      // 3. Ищем связанный слот (без join’ов с FOR UPDATE)
      const slot = await manager.findOne(TimeSlot, {
        where: {
          videoLessonId: lesson.id,
          coachId: lesson.coachId,
          status: TimeSlotStatus.BOOKED,
        },
      });

      if (slot) {
        // 4. Освобождаем слот
        slot.status = TimeSlotStatus.FREE;
        slot.videoLessonId = null;
        await manager.save(slot);
      }

      return { success: true };
    });
  }

  async canJoin(meId: string, relationId: string, now = new Date()) {
    const link = await this.clientCoachService.requireMembershipByRelationId(
      meId,
      relationId,
    );
    const startUpperBound = new Date(
      now.getTime() + this.earlyJoinMin * 60_000,
    );
    const endLowerBound = new Date(now.getTime() - this.lateJoinMin * 60_000);

    const lesson = await this.lessons.findOne({
      where: {
        clientCoachId: link.id,
        status: Not(LessonStatus.CANCELED),
        startAt: Raw((a) => `${a} <= :startUpperBound`, { startUpperBound }),
        endAt: Raw((a) => `${a} >= :endLowerBound`, { endLowerBound }),
      },
      order: { startAt: 'ASC' },
    });
    return { link, lesson };
  }

  async touchProgress(
    meId: string,
    relationId: string,
    lessonId: string,
    now = new Date(),
  ) {
    const link = await this.clientCoachService.requireMembershipByRelationId(
      meId,
      relationId,
    );
    const lesson = await this.lessons.findOne({
      where: { id: lessonId, clientCoachId: link.id },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const prevStatus = lesson.status;
    if (lesson.status === LessonStatus.SCHEDULED && now >= lesson.startAt) {
      lesson.status = LessonStatus.IN_PROGRESS;
    } else if (
      lesson.status === LessonStatus.IN_PROGRESS &&
      now >= lesson.endAt
    ) {
      lesson.status = LessonStatus.COMPLETED;
    }

    if (lesson.status !== prevStatus) {
      await this.lessons.save(lesson);
    }

    return lesson;
  }

  async syncStatuses(now = new Date()) {
    const windowStart = new Date(now.getTime() - this.statusSyncLookbackMs);

    const scheduledToStart = await this.lessons.find({
      where: {
        status: LessonStatus.SCHEDULED,
        startAt: Between(windowStart, now),
      },
    });

    const inProgressToFinish = await this.lessons.find({
      where: {
        status: LessonStatus.IN_PROGRESS,
        endAt: Between(windowStart, now),
      },
    });

    const updates: VideoLesson[] = [];
    for (const lesson of scheduledToStart) {
      lesson.status = LessonStatus.IN_PROGRESS;
      updates.push(lesson);
    }
    for (const lesson of inProgressToFinish) {
      lesson.status = LessonStatus.COMPLETED;
      updates.push(lesson);
    }

    if (updates.length > 0) {
      await this.lessons.save(updates);
    }

    return updates;
  }

  async listForCoachByDay(coachId: string, date: string) {
    const { from, to } = this.getDayRange(date);

    return this.lessons.find({
      where: {
        coachId,
        status: In([LessonStatus.SCHEDULED, LessonStatus.IN_PROGRESS]),
        startAt: Between(from, to),
      },
      order: { startAt: 'ASC' },
      relations: {
        client: true,
        relation: true,
      },
    });
  }
}
