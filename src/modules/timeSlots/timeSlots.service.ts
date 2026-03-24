import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource, In, EntityManager } from 'typeorm';
import { TimeSlot, TimeSlotStatus } from '../../entities/time-slot.entity';
import { ClientCoach } from '../../entities/client-coach.entity';
import { CreateSlotDto } from './dto/create-slot.dto';
import { DayQueryDto } from './dto/day-query.dto';
import { CoachBookSlotDto } from './dto/coach-book-slot.dto';
import {
  ClientCoachTransactionType,
  CoachOrderStatus,
  CoachWorkoutSessionStatus,
} from '../../config/emuns/coach-billing';
import { ClientCoachTransaction } from '../../entities/client-coach-transaction.entity';
import { CoachOrder } from '../../entities/coach-order.entity';
import { CoachWorkoutSessions } from '../../entities/coach-workout-sessions';

@Injectable()
export class TimeSlotsService {
  constructor(
    @InjectRepository(TimeSlot)
    private readonly slotsRepo: Repository<TimeSlot>,

    @InjectRepository(ClientCoach)
    private readonly clientCoachRepo: Repository<ClientCoach>,

    @InjectRepository(CoachWorkoutSessions)
    private readonly coachWorkoutSessionsRepo: Repository<CoachWorkoutSessions>,

    private readonly dataSource: DataSource,
  ) {}

  // ====== ВСПОМОГАТЕЛЬНОЕ ======

  private getDayRange(date: string): { from: Date; to: Date } {
    const [year, month, day] = date.split('-').map((part) => Number(part));
    if (
      !year ||
      Number.isNaN(year) ||
      !month ||
      Number.isNaN(month) ||
      !day ||
      Number.isNaN(day)
    ) {
      throw new BadRequestException('Invalid date');
    }
    const from = new Date(year, month - 1, day, 0, 0, 0, 0);
    const to = new Date(year, month - 1, day, 23, 59, 59, 999);
    return { from, to };
  }

  // ====== ТРЕНЕР ======

  async createSlotForCoach(coachId: string, dto: CreateSlotDto) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);

    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new BadRequestException('Invalid slot date');
    }

    if (startAt >= endAt) {
      throw new BadRequestException('startAt must be before endAt');
    }

    const overlappedSlot = await this.slotsRepo
      .createQueryBuilder('slot')
      .where('slot.coachId = :coachId', { coachId })
      .andWhere('slot.status != :disabled', {
        disabled: TimeSlotStatus.DISABLED,
      })
      .andWhere('slot.startAt < :endAt', { endAt })
      .andWhere('slot.endAt > :startAt', { startAt })
      .getOne();

    if (overlappedSlot) {
      throw new BadRequestException('Slot overlaps with existing slot');
    }

    const slot = this.slotsRepo.create({
      coachId,
      startAt,
      endAt,
      note: dto.note ?? null,
      status: TimeSlotStatus.FREE,
    });

    try {
      return await this.slotsRepo.save(slot);
    } catch (e: any) {
      if (e.code === '23505') {
        throw new BadRequestException('Slot with this time already exists');
      }

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

    const slots = await this.slotsRepo.find({
      where: {
        coachId,
        startAt: Between(from, to),
      },
      order: { startAt: 'ASC' },
    });

    if (!slots.length) {
      return [];
    }

    const slotIds = slots.map((slot) => slot.id);

    const sessions = await this.coachWorkoutSessionsRepo.find({
      where: {
        timeSlotId: In(slotIds),
      },
      relations: {
        client: true,
      },
    });

    const sessionBySlotId = new Map(
      sessions.map((session) => [session.timeSlotId, session]),
    );

    return slots.map((slot) => {
      const session = sessionBySlotId.get(slot.id);

      return {
        ...slot,
        bookedSession: session
          ? {
              id: session.id,
              status: session.status,
              clientId: session.clientId,
              client: session.client,
              orderId: session.orderId,
              scheduledAt: session.scheduledAt,
            }
          : null,
      };
    });
  }

  async coachBookSlotForClient(
    coachId: string,
    slotId: string,
    dto: CoachBookSlotDto,
  ) {
    const { clientId } = dto;

    return this.dataSource.transaction(async (manager) => {
      const relation = await manager.findOne(ClientCoach, {
        where: { coachId, clientId, isActive: true },
        lock: { mode: 'pessimistic_write' },
      });

      if (!relation) {
        throw new BadRequestException('No active relation with this client');
      }

      if (relation.sessionsRemaining <= 0) {
        throw new BadRequestException('Client has no remaining sessions');
      }

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

      if (slot.startAt <= new Date()) {
        throw new BadRequestException('Cannot book slot in the past');
      }

      const order = await this.findAvailableOrder(manager, relation.id);
      if (!order) {
        throw new BadRequestException('No paid order available for booking');
      }

      const durationMinutes = Math.max(
        1,
        Math.round((slot.endAt.getTime() - slot.startAt.getTime()) / 60000),
      );

      const sessionPrice = Number(
        (Number(order.amount) / Math.max(order.sessionCount, 1)).toFixed(2),
      );

      const session = manager.create(CoachWorkoutSessions, {
        clientId,
        coachId,
        clientCoachId: relation.id,
        orderId: order.id,
        timeSlotId: slot.id,
        scheduledAt: slot.startAt,
        durationMinutes,
        price: sessionPrice,
        currency: order.currency,
        status: CoachWorkoutSessionStatus.BOOKED,
      });

      const savedSession = await manager.save(session);

      slot.status = TimeSlotStatus.BOOKED;
      await manager.save(slot);

      relation.sessionsReserved += 1;
      relation.sessionsRemaining -= 1;
      relation.isActive =
        relation.sessionsRemaining > 0 || relation.sessionsReserved > 0;

      order.sessionsReserved += 1;
      await manager.save(order);
      await manager.save(relation);

      const trx = manager.create(ClientCoachTransaction, {
        clientCoachId: relation.id,
        type: ClientCoachTransactionType.SESSION_RESERVE,
        deltaSessions: -1,
        balanceAfter: relation.sessionsRemaining,
        orderId: order.id,
        comment: `Тренер забронировал слот ${slot.id} для клиента ${clientId}, сессия ${savedSession.id}`,
      });

      await manager.save(trx);

      return savedSession;
    });
  }

  // ====== КЛИЕНТ / ПОЛЬЗОВАТЕЛЬ ======

  async getSlotsForClientByDay(
    clientId: string,
    coachId: string,
    query: DayQueryDto,
  ) {
    const { from, to } = this.getDayRange(query.date);
    const now = new Date();

    const slots = await this.slotsRepo.find({
      where: {
        coachId,
        startAt: Between(from, to),
      },
      order: { startAt: 'ASC' },
    });

    const upcomingSlots = slots.filter((slot) => slot.startAt >= now);

    if (!upcomingSlots.length) {
      return [];
    }

    const slotIds = upcomingSlots.map((slot) => slot.id);

    const sessions = await this.coachWorkoutSessionsRepo.find({
      where: {
        timeSlotId: In(slotIds),
      },
      relations: {
        client: true,
      },
    });

    const sessionBySlotId = new Map(
      sessions.map((session) => [session.timeSlotId, session]),
    );

    return upcomingSlots
      .filter((slot) => {
        const session = sessionBySlotId.get(slot.id);

        // свободные слоты доступны всем
        if (slot.status === TimeSlotStatus.FREE) {
          return true;
        }

        // занятый слот показываем только тому клиенту, который его забронировал
        if (
          slot.status === TimeSlotStatus.BOOKED &&
          session?.clientId === clientId
        ) {
          return true;
        }

        return false;
      })
      .map((slot) => {
        const session = sessionBySlotId.get(slot.id);

        return {
          ...slot,
          bookedSession:
            session && session.clientId === clientId
              ? {
                  id: session.id,
                  status: session.status,
                  clientId: session.clientId,
                  client: session.client,
                  orderId: session.orderId,
                  scheduledAt: session.scheduledAt,
                }
              : null,
        };
      });
  }

  async clientBookSlot(clientId: string, slotId: string) {
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

      if (slot.startAt <= new Date()) {
        throw new BadRequestException('Cannot book slot in the past');
      }

      const relation = await manager.findOne(ClientCoach, {
        where: {
          coachId: slot.coachId,
          clientId,
          isActive: true,
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (!relation) {
        throw new ForbiddenException('No active relation with this coach');
      }

      if (relation.sessionsRemaining <= 0) {
        throw new BadRequestException('No remaining sessions');
      }

      const order = await this.findAvailableOrder(manager, relation.id);
      if (!order) {
        throw new BadRequestException('No paid order available for booking');
      }

      const durationMinutes = Math.max(
        1,
        Math.round((slot.endAt.getTime() - slot.startAt.getTime()) / 60000),
      );

      const sessionPrice = Number(
        (Number(order.amount) / Math.max(order.sessionCount, 1)).toFixed(2),
      );

      const session = manager.create(CoachWorkoutSessions, {
        clientId,
        coachId: slot.coachId,
        clientCoachId: relation.id,
        orderId: order.id,
        timeSlotId: slot.id,
        scheduledAt: slot.startAt,
        durationMinutes,
        price: sessionPrice,
        currency: order.currency,
        status: CoachWorkoutSessionStatus.BOOKED,
      });

      const savedSession = await manager.save(session);

      slot.status = TimeSlotStatus.BOOKED;
      await manager.save(slot);

      relation.sessionsReserved += 1;
      relation.sessionsRemaining -= 1;
      relation.isActive =
        relation.sessionsRemaining > 0 || relation.sessionsReserved > 0;

      order.sessionsReserved += 1;
      await manager.save(order);
      await manager.save(relation);

      const trx = manager.create(ClientCoachTransaction, {
        clientCoachId: relation.id,
        type: ClientCoachTransactionType.SESSION_RESERVE,
        deltaSessions: -1,
        balanceAfter: relation.sessionsRemaining,
        orderId: order.id,
        comment: `Резерв слота ${slot.id} под сессию ${savedSession.id}`,
      });

      await manager.save(trx);

      return savedSession;
    });
  }

  private findAvailableOrder(manager: EntityManager, relationId: string) {
    return manager
      .getRepository(CoachOrder)
      .createQueryBuilder('order')
      .setLock('pessimistic_write')
      .where('order.clientCoachId = :relationId', { relationId })
      .andWhere('order.status = :status', {
        status: CoachOrderStatus.PAID,
      })
      .andWhere(
        '(order.sessionsReserved + order.sessionsUsed) < order.sessionCount',
      )
      .orderBy('order.paidAt', 'ASC')
      .addOrderBy('order.createdAt', 'ASC')
      .getOne();
  }
}
