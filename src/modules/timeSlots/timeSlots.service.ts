import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource } from 'typeorm';
import { TimeSlot, TimeSlotStatus } from '../../entities/time-slot.entity';
import { ClientCoach } from '../../entities/client-coach.entity';
import { VideoLesson, LessonStatus } from '../../entities/video-lesson.entity';
import { User } from '../../entities/user.entity';
import { CreateSlotDto } from './dto/create-slot.dto';
import { DayQueryDto } from './dto/day-query.dto';
import { BookSlotDto } from './dto/book-slot.dto';
import { CoachBookSlotDto } from './dto/coach-book-slot.dto';

@Injectable()
export class TimeSlotsService {
  constructor(
    @InjectRepository(TimeSlot)
    private readonly slotsRepo: Repository<TimeSlot>,
    @InjectRepository(ClientCoach)
    private readonly clientCoachRepo: Repository<ClientCoach>,
    @InjectRepository(VideoLesson)
    private readonly videoLessonRepo: Repository<VideoLesson>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  // ====== ВСПОМОГАТЕЛЬНОЕ ======

  private getDayRange(date: string): { from: Date; to: Date } {
    // простой вариант без часовых поясов: считаем, что date в UTC
    const from = new Date(`${date}T00:00:00.000Z`);
    const to = new Date(`${date}T23:59:59.999Z`);
    return { from, to };
  }

  // ====== ТРЕНЕР ======

  async createSlotForCoach(coachId: string, dto: CreateSlotDto) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);

    if (startAt >= endAt) {
      throw new BadRequestException('startAt must be before endAt');
    }

    let clientCoachId: string | null = null;

    // Если тренер указал клиента — создаём приватный слот
    if (dto.clientId) {
      const relation = await this.clientCoachRepo.findOne({
        where: {
          coachId,
          clientId: dto.clientId,
          isActive: true,
        },
      });

      if (!relation) {
        throw new BadRequestException('No active relation with this client');
      }

      clientCoachId = relation.id;
    }

    const slot = this.slotsRepo.create({
      coachId,
      clientCoachId,
      startAt,
      endAt,
      note: dto.note ?? null,
      status: TimeSlotStatus.FREE,
    });

    try {
      return await this.slotsRepo.save(slot);
    } catch (e: any) {
      console.error('Create slot error:', e); // временно для отладки

      if (e.code === '23505') {
        // действительно нарушение уникального индекса
        throw new BadRequestException('Slot with this time already exists');
      }

      // всё остальное — пробрасываем как есть, чтобы увидеть реальную причину
      throw e;
    }
  }

  async deleteSlotForCoach(coachId: string, slotId: string) {
    const slot = await this.slotsRepo.findOne({
      where: { id: slotId, coachId },
    });
    if (!slot) {
      throw new NotFoundException('Slot not found');
    }
    if (slot.status === TimeSlotStatus.BOOKED) {
      throw new BadRequestException('Cannot delete booked slot');
    }

    await this.slotsRepo.remove(slot);
  }

  async getSlotsForCoachByDay(coachId: string, query: DayQueryDto) {
    const { from, to } = this.getDayRange(query.date);

    return this.slotsRepo.find({
      where: {
        coachId,
        startAt: Between(from, to),
      },
      order: { startAt: 'ASC' },
      relations: {
        videoLesson: {
          client: true,
        },
        relation: true,
      },
    });
  }

  async coachBookSlotForClient(
    coachId: string,
    slotId: string,
    dto: CoachBookSlotDto,
  ) {
    const { clientId, title, notes } = dto;

    // Проверяем, что у тренера есть активная пара с этим клиентом
    const relation = await this.clientCoachRepo.findOne({
      where: { coachId, clientId, isActive: true },
    });

    if (!relation) {
      throw new BadRequestException('No active relation with this client');
    }

    return this.dataSource.transaction(async (manager) => {
      const slot = await manager.findOne(TimeSlot, {
        where: { id: slotId, coachId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!slot) {
        throw new NotFoundException('Slot not found');
      }
      if (slot.status !== TimeSlotStatus.FREE) {
        throw new BadRequestException('Slot is not free');
      }

      const lesson = manager.create(VideoLesson, {
        clientCoachId: relation.id,
        clientId,
        coachId,
        startAt: slot.startAt,
        endAt: slot.endAt,
        status: LessonStatus.SCHEDULED,
        title: title ?? null,
        notes: notes ?? null,
        createdBy: coachId,
      });

      const savedLesson = await manager.save(lesson);

      slot.status = TimeSlotStatus.BOOKED;
      slot.videoLessonId = savedLesson.id;

      await manager.save(slot);

      return savedLesson;
    });
  }

  // ====== КЛИЕНТ / ПОЛЬЗОВАТЕЛЬ ======

  async getSlotsForClientByDay(
    clientId: string,
    coachId: string,
    query: DayQueryDto,
  ) {
    const { from, to } = this.getDayRange(query.date);

    // активная пара (если есть)
    const relation = await this.clientCoachRepo.findOne({
      where: { clientId, coachId, isActive: true },
    });

    const qb = this.slotsRepo
      .createQueryBuilder('slot')
      .leftJoinAndSelect('slot.videoLesson', 'lesson')
      .leftJoinAndSelect('slot.relation', 'relation')
      .where('slot.coachId = :coachId', { coachId })
      .andWhere('slot.startAt BETWEEN :from AND :to', { from, to })
      .orderBy('slot.startAt', 'ASC');

    // Клиент видит:
    //  - свободные публичные слоты
    //  - свободные слоты, привязанные к его паре
    //  - свои уже забронированные слоты
    qb.andWhere(
      `
      (
        (slot.status = :freeStatus AND (slot.clientCoachId IS NULL ${
          relation ? 'OR slot.clientCoachId = :relId' : ''
        }))
      )
    `,
      {
        freeStatus: TimeSlotStatus.FREE,
        bookedStatus: TimeSlotStatus.BOOKED,
        clientId,
        ...(relation && { relId: relation.id }),
      },
    );

    return qb.getMany();
  }

  async clientBookSlot(clientId: string, slotId: string, dto: BookSlotDto) {
    return this.dataSource.transaction(async (manager) => {
      const slot = await manager.findOne(TimeSlot, {
        where: { id: slotId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!slot) {
        throw new NotFoundException('Slot not found');
      }
      if (slot.status !== TimeSlotStatus.FREE) {
        throw new BadRequestException('Slot is not free');
      }

      // проверяем наличие/валидность пары
      let relation: ClientCoach | null = null;

      if (slot.clientCoachId) {
        relation = await manager.findOne(ClientCoach, {
          where: { id: slot.clientCoachId, isActive: true },
        });
        if (!relation || relation.clientId !== clientId) {
          throw new ForbiddenException('Slot is not available for this client');
        }
      } else {
        relation = await manager.findOne(ClientCoach, {
          where: { coachId: slot.coachId, clientId, isActive: true },
        });
        if (!relation) {
          throw new ForbiddenException('No active relation with this coach');
        }
      }

      const lesson = manager.create(VideoLesson, {
        clientCoachId: relation.id,
        clientId,
        coachId: slot.coachId,
        startAt: slot.startAt,
        endAt: slot.endAt,
        status: LessonStatus.SCHEDULED,
        title: dto.title ?? null,
        notes: dto.notes ?? null,
        createdBy: clientId,
      });

      const savedLesson = await manager.save(lesson);

      slot.status = TimeSlotStatus.BOOKED;
      slot.videoLessonId = savedLesson.id;

      await manager.save(slot);

      return savedLesson;
    });
  }
}
