import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, Raw } from 'typeorm';
import { VideoLesson, LessonStatus } from '../../entities/video-lesson.entity';
import { ClientCoachService } from '../clientCoach/clientCoach.service';

@Injectable()
export class VideoLessonsService {
  private earlyJoinMin = 5;
  private lateJoinMin = 10;

  constructor(
    @InjectRepository(VideoLesson)
    private readonly lessons: Repository<VideoLesson>,
    private readonly cc: ClientCoachService,
  ) {}

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
    const link = await this.cc.requireActiveByRelationId(meId, relationId);
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
    const link = await this.cc.requireMembershipByRelationId(meId, relationId);
    return this.lessons.find({
      where: { clientCoachId: link.id, status: Not(LessonStatus.CANCELED) },
      order: { startAt: 'ASC' },
    });
  }

  async cancel(meId: string, lessonId: string) {
    const lesson = await this.lessons.findOne({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const link = await this.cc.requireMembershipByRelationId(
      meId,
      lesson.clientCoachId,
    );
    if (meId !== link.clientId && meId !== link.coachId)
      throw new ForbiddenException();

    if (lesson.status === LessonStatus.CANCELED) return lesson;
    lesson.status = LessonStatus.CANCELED;
    return this.lessons.save(lesson);
  }

  async canJoin(meId: string, relationId: string, now = new Date()) {
    const link = await this.cc.requireMembershipByRelationId(meId, relationId);
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
    const link = await this.cc.requireMembershipByRelationId(meId, relationId);
    const lesson = await this.lessons.findOne({
      where: { id: lessonId, clientCoachId: link.id },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const prevStatus = lesson.status;
    if (lesson.status === LessonStatus.SCHEDULED && now >= lesson.startAt) {
      lesson.status = LessonStatus.IN_PROGRESS;
    } else if (lesson.status === LessonStatus.IN_PROGRESS && now >= lesson.endAt) {
      lesson.status = LessonStatus.COMPLETED;
    }

    if (lesson.status !== prevStatus) {
      await this.lessons.save(lesson);
    }

    return lesson;
  }
}
