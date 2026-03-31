import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  DataSource,
  EntityManager,
  LessThanOrEqual,
  Repository,
} from 'typeorm';
import { CoachWorkoutSessions } from '../../entities/coach-workout-sessions';
import { ClientCoach } from '../../entities/client-coach.entity';
import { ClientCoachTransaction } from '../../entities/client-coach-transaction.entity';
import { TimeSlot, TimeSlotStatus } from '../../entities/time-slot.entity';
import { CoachPayment } from '../../entities/coach-payments';
import { CoachOrder } from '../../entities/coach-order.entity';
import {
  CoachPaymentStatus,
  CoachPaymentType,
  CoachWorkoutSessionStatus,
  ClientCoachTransactionType,
} from '../../config/emuns/coach-billing';
import { ClientCoachService } from '../clientCoach/clientCoach.service';
import { ListClientUpcomingSessionsQueryDto } from './dto/list-client-upcoming.query';
import { PAYMENT_PROVIDER } from '../../config/constants/payments';
import { PaymentProvider } from '../../config/interfaces/payments';

@Injectable()
export class CoachWorkoutSessionsService {
  private readonly earlyJoinMinutes = 5;
  private readonly lateJoinMinutes = 10;
  private readonly historyCutoffDays = 30;
  private readonly autoConfirmDelayMs = 24 * 60 * 60 * 1000; // 24h
  private readonly canJoinLookupMs = 6 * 60 * 60 * 1000; // 6h lookback
  private readonly logger = new Logger(CoachWorkoutSessionsService.name);

  constructor(
    @InjectRepository(CoachWorkoutSessions)
    private readonly sessionsRepo: Repository<CoachWorkoutSessions>,
    private readonly clientCoachService: ClientCoachService,
    private readonly dataSource: DataSource,
    @Inject(PAYMENT_PROVIDER)
    private readonly paymentProvider: PaymentProvider,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  private async handleStatusSyncCron() {
    try {
      await this.syncStatuses();
    } catch (err) {
      this.logger.error(
        'Failed to sync coach workout sessions',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  async listForRelation(meId: string, relationId: string) {
    const link = await this.clientCoachService.requireMembershipByRelationId(
      meId,
      relationId,
    );

    const historyCutoff = new Date(
      Date.now() - this.historyCutoffDays * 24 * 60 * 60 * 1000,
    );

    return this.sessionsRepo
      .createQueryBuilder('session')
      .where('session.clientCoachId = :relationId', { relationId: link.id })
      .andWhere('session.status NOT IN (:...cancelled)', {
        cancelled: [
          CoachWorkoutSessionStatus.CANCELLED_BY_CLIENT,
          CoachWorkoutSessionStatus.CANCELLED_BY_COACH,
        ],
      })
      .andWhere(
        `(
          session.status NOT IN (:...finalized)
          OR session.scheduledAt >= :historyCutoff
        )`,
        {
          finalized: [
            CoachWorkoutSessionStatus.CONFIRMED_BY_CLIENT,
            CoachWorkoutSessionStatus.AUTO_CONFIRMED,
          ],
          historyCutoff,
        },
      )
      .orderBy('session.scheduledAt', 'DESC')
      .getMany();
  }

  async listForCoachByDay(coachId: string, date: string) {
    const { from, to } = this.getDayRange(date);
    const qb = this.sessionsRepo
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.client', 'client')
      .where('session.coachId = :coachId', { coachId })
      .andWhere('session.scheduledAt BETWEEN :from AND :to', { from, to })
      .orderBy('session.scheduledAt', 'ASC');

    const items = await qb.getMany();
    return {
      items,
      total: items.length,
      skip: 0,
      take: items.length,
    };
  }

  async listUpcomingForClient(
    clientId: string,
    query: ListClientUpcomingSessionsQueryDto,
  ) {
    const from =
      query.from && query.from.trim().length
        ? new Date(query.from)
        : new Date();
    if (Number.isNaN(from.getTime())) {
      throw new BadRequestException('Invalid from date');
    }

    const skip = query.skip ?? 0;
    const take = Math.min(query.take ?? 20, 100);

    const excludedStatuses = [
      CoachWorkoutSessionStatus.CANCELLED_BY_CLIENT,
      CoachWorkoutSessionStatus.CANCELLED_BY_COACH,
      CoachWorkoutSessionStatus.CONFIRMED_BY_CLIENT,
      CoachWorkoutSessionStatus.AUTO_CONFIRMED,
    ];

    const qb = this.sessionsRepo
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.coach', 'coach')
      .leftJoinAndSelect('session.clientCoach', 'relation')
      .where('session.clientId = :clientId', { clientId })
      .andWhere('session.status NOT IN (:...excluded)', {
        excluded: excludedStatuses,
      })
      .andWhere('session.scheduledAt >= :from', { from })
      .orderBy('session.scheduledAt', 'ASC')
      .skip(skip)
      .take(take);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      skip,
      take,
    };
  }

  async cancelSession(
    userId: string,
    sessionId: string,
    dto?: { reason?: string },
  ) {
    return this.dataSource.transaction(async (manager) => {
      const session = await manager.findOne(CoachWorkoutSessions, {
        where: { id: sessionId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!session) throw new NotFoundException('Session not found');

      const isClient = session.clientId === userId;
      const isCoach = session.coachId === userId;
      if (!isClient && !isCoach) {
        throw new ForbiddenException('You cannot cancel this session');
      }

      if (
        session.status === CoachWorkoutSessionStatus.CONFIRMED_BY_CLIENT ||
        session.status === CoachWorkoutSessionStatus.AUTO_CONFIRMED
      ) {
        throw new BadRequestException('Session already finalized');
      }

      if (
        session.status === CoachWorkoutSessionStatus.CANCELLED_BY_CLIENT ||
        session.status === CoachWorkoutSessionStatus.CANCELLED_BY_COACH
      ) {
        throw new BadRequestException('Session already cancelled');
      }

      const relation = await manager.findOne(ClientCoach, {
        where: { id: session.clientCoachId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!relation) throw new NotFoundException('Relation not found');

      const order = await manager.findOne(CoachOrder, {
        where: { id: session.orderId },
        lock: { mode: 'pessimistic_write' },
      });

      const slot = await manager.findOne(TimeSlot, {
        where: { id: session.timeSlotId },
        lock: { mode: 'pessimistic_write' },
      });
      if (slot) {
        slot.status = TimeSlotStatus.FREE;
        await manager.save(slot);
      }

      relation.sessionsReserved = Math.max(relation.sessionsReserved - 1, 0);
      relation.sessionsRemaining += 1;
      this.updateRelationActivity(relation);
      await manager.save(relation);

      if (order) {
        order.sessionsReserved = Math.max(order.sessionsReserved - 1, 0);
        await manager.save(order);
      }

      session.status = isClient
        ? CoachWorkoutSessionStatus.CANCELLED_BY_CLIENT
        : CoachWorkoutSessionStatus.CANCELLED_BY_COACH;
      session.cancelledAt = new Date();
      session.cancelReason = dto?.reason ?? null;
      await manager.save(session);

      const trx = manager.create(ClientCoachTransaction, {
        clientCoachId: relation.id,
        type: ClientCoachTransactionType.SESSION_RETURN,
        deltaSessions: 1,
        balanceAfter: relation.sessionsRemaining,
        orderId: session.orderId,
        comment: `Сессия ${session.id} отменена ${
          isClient ? 'клиентом' : 'тренером'
        }`,
      });
      await manager.save(trx);

      return session;
    });
  }

  async markCompletedByCoach(coachId: string, sessionId: string) {
    const session = await this.sessionsRepo.findOne({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.coachId !== coachId) {
      throw new ForbiddenException('You cannot update this session');
    }
    if (session.status !== CoachWorkoutSessionStatus.BOOKED) {
      throw new BadRequestException('Session cannot be completed');
    }

    session.status = CoachWorkoutSessionStatus.COMPLETED_BY_COACH;
    session.coachMarkedCompletedAt = new Date();
    return this.sessionsRepo.save(session);
  }

  async confirmByClient(clientId: string, sessionId: string) {
    return this.dataSource.transaction(async (manager) => {
      const session = await manager.findOne(CoachWorkoutSessions, {
        where: { id: sessionId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!session) throw new NotFoundException('Session not found');
      if (session.clientId !== clientId) {
        throw new ForbiddenException('You cannot confirm this session');
      }

      return this.finalizeCompletedSession(
        manager,
        session,
        CoachWorkoutSessionStatus.CONFIRMED_BY_CLIENT,
        {
          field: 'clientConfirmedAt',
          timestamp: new Date(),
        },
        'клиентом',
      );
    });
  }

  async autoConfirmCompletedSessions(now = new Date()) {
    const threshold = new Date(now.getTime() - this.autoConfirmDelayMs);
    const candidates = await this.sessionsRepo.find({
      where: {
        status: CoachWorkoutSessionStatus.COMPLETED_BY_COACH,
        coachMarkedCompletedAt: LessThanOrEqual(threshold),
      },
    });

    let processed = 0;
    for (const session of candidates) {
      await this.dataSource.transaction(async (manager) => {
        const fresh = await manager.findOne(CoachWorkoutSessions, {
          where: { id: session.id },
          lock: { mode: 'pessimistic_write' },
        });
        if (
          !fresh ||
          fresh.status !== CoachWorkoutSessionStatus.COMPLETED_BY_COACH ||
          !fresh.coachMarkedCompletedAt ||
          fresh.coachMarkedCompletedAt > threshold
        ) {
          return;
        }

        await this.finalizeCompletedSession(
          manager,
          fresh,
          CoachWorkoutSessionStatus.AUTO_CONFIRMED,
          {
            field: 'autoConfirmedAt',
            timestamp: now,
          },
          'системой',
        );
        processed += 1;
      });
    }
    return processed;
  }

  async canJoin(meId: string, relationId: string, now = new Date()) {
    const link = await this.clientCoachService.requireMembershipByRelationId(
      meId,
      relationId,
    );
    const startUpperBound = new Date(
      now.getTime() + this.earlyJoinMinutes * 60_000,
    );
    const startLowerBound = new Date(now.getTime() - this.canJoinLookupMs);

    const sessions = await this.sessionsRepo.find({
      where: {
        clientCoachId: link.id,
        scheduledAt: Between(startLowerBound, startUpperBound),
      },
      order: { scheduledAt: 'ASC' },
    });

    const earlyMs = this.earlyJoinMinutes * 60_000;
    const lateMs = this.lateJoinMinutes * 60_000;
    const nowMs = now.getTime();
    const session = sessions.find((candidate) => {
      if (
        candidate.status === CoachWorkoutSessionStatus.CANCELLED_BY_CLIENT ||
        candidate.status === CoachWorkoutSessionStatus.CANCELLED_BY_COACH
      ) {
        return false;
      }
      const startMs = candidate.scheduledAt.getTime();
      const endMs = startMs + candidate.durationMinutes * 60_000;
      const joinOpensAt = startMs - earlyMs;
      const joinClosesAt = endMs + lateMs;
      return nowMs >= joinOpensAt && nowMs <= joinClosesAt;
    });

    return { link, session: session ?? null };
  }

  async syncStatuses(now = new Date()) {
    return this.autoConfirmCompletedSessions(now);
  }

  private getDayRange(date: string): { from: Date; to: Date } {
    const from = new Date(`${date}T00:00:00.000Z`);
    const to = new Date(`${date}T23:59:59.999Z`);
    if (Number.isNaN(+from) || Number.isNaN(+to)) {
      throw new BadRequestException('Invalid date');
    }
    return { from, to };
  }

  private updateRelationActivity(relation: ClientCoach) {
    relation.isActive =
      relation.sessionsRemaining > 0 || relation.sessionsReserved > 0;
    if (relation.isActive) {
      relation.deactivatedAt = null;
      if (!relation.activatedAt) {
        relation.activatedAt = new Date();
      }
    } else {
      relation.deactivatedAt = new Date();
    }
  }

  private formatMoney(value: number | string) {
    const num = typeof value === 'number' ? value : Number(value ?? 0);
    return num.toFixed(2);
  }

  private async finalizeCompletedSession(
    manager: EntityManager,
    session: CoachWorkoutSessions,
    finalStatus:
      | CoachWorkoutSessionStatus.CONFIRMED_BY_CLIENT
      | CoachWorkoutSessionStatus.AUTO_CONFIRMED,
    timestamp: {
      field: 'clientConfirmedAt' | 'autoConfirmedAt';
      timestamp: Date;
    },
    confirmedBy: string,
  ) {
    if (session.status !== CoachWorkoutSessionStatus.COMPLETED_BY_COACH) {
      throw new BadRequestException('Session is not ready for confirmation');
    }

    const relation = await manager.findOne(ClientCoach, {
      where: { id: session.clientCoachId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!relation) throw new NotFoundException('Relation not found');

    const order = await manager.findOne(CoachOrder, {
      where: { id: session.orderId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!order) throw new NotFoundException('Order not found');

    relation.sessionsReserved = Math.max(relation.sessionsReserved - 1, 0);
    relation.sessionsUsed += 1;
    this.updateRelationActivity(relation);

    session.status = finalStatus;
    if (timestamp.field === 'clientConfirmedAt') {
      session.clientConfirmedAt = timestamp.timestamp;
    } else {
      session.autoConfirmedAt = timestamp.timestamp;
    }

    await manager.save(relation);
    await manager.save(session);

    order.sessionsReserved = Math.max(order.sessionsReserved - 1, 0);
    order.sessionsUsed += 1;
    await manager.save(order);

    const trx = manager.create(ClientCoachTransaction, {
      clientCoachId: relation.id,
      type: ClientCoachTransactionType.SESSION_DEBIT,
      deltaSessions: 0,
      balanceAfter: relation.sessionsRemaining,
      orderId: session.orderId,
      comment: `Сессия ${session.id} подтверждена ${confirmedBy}`,
    });
    await manager.save(trx);

    const amount = this.formatMoney(session.price);
    const payment = manager.create(CoachPayment, {
      clientCoachId: relation.id,
      orderId: session.orderId,
      coachSessionId: session.id,
      clientId: session.clientId,
      coachId: session.coachId,
      type: CoachPaymentType.COACH_PAYOUT,
      status: CoachPaymentStatus.READY_FOR_PAYOUT,
      amount,
      platformFee: '0.00',
      coachAmount: amount,
      currency: session.currency,
      readyForPayoutAt: new Date(),
    });
    await manager.save(payment);

    await this.requestCoachPayout(manager, payment, session);

    return session;
  }

  private async requestCoachPayout(
    manager: EntityManager,
    payment: CoachPayment,
    session: CoachWorkoutSessions,
  ) {
    try {
      const result = await this.paymentProvider.createCoachPayout({
        coachId: session.coachId,
        clientId: session.clientId,
        orderId: session.orderId,
        sessionId: session.id,
        amount: Number(payment.coachAmount ?? payment.amount ?? 0),
        currency: session.currency,
      });

      payment.status = CoachPaymentStatus.PAYOUT_PENDING;
      payment.provider = result.provider ?? payment.provider ?? 'payout';
      payment.providerExternalId = result.externalPayoutId;
      payment.providerMeta = {
        ...(payment.providerMeta ?? {}),
        payoutRaw: result.raw ?? null,
      };

      await manager.save(payment);
    } catch (err) {
      this.logger.error(
        `Failed to request payout for session ${session.id}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
