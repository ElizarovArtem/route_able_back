import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { ClientCoachTransactionType } from '../../config/emuns/coach-billing';
import { ClientCoach } from '../../entities/client-coach.entity';
import { ClientCoachTransaction } from '../../entities/client-coach-transaction.entity';
import { CoachOrder } from '../../entities/coach-order.entity';

/**
 * Единственное место, где меняется баланс тренировок пары клиент↔тренер.
 *
 * Баланс живёт в трёх местах (`ClientCoach`, `CoachOrder`, ledger `ClientCoachTransaction`),
 * поэтому все операции обновляют их вместе, в переданной транзакции и под блокировкой пары.
 *
 *   credit   — оплачен заказ:     total += n                 ledger +n
 *   reserve  — забронирован слот: reserved += 1              ledger -1
 *   release  — бронь отменена:    reserved -= 1              ledger +1
 *   confirm  — занятие проведено: reserved -= 1, used += 1   ledger  0
 *
 * `ClientCoach.sessionsRemaining` вычисляется базой (`total - used - reserved`),
 * поэтому здесь его нельзя записать, только прочитать.
 */
@Injectable()
export class SessionBalanceService {
  async credit(
    manager: EntityManager,
    relationId: string,
    order: CoachOrder,
    comment: string,
  ) {
    const relation = await this.lockRelation(manager, relationId);

    relation.sessionsTotal += order.sessionCount;
    relation.activatedAt = relation.activatedAt ?? new Date();

    return this.persist(manager, relation, {
      type: ClientCoachTransactionType.PURCHASE_CREDIT,
      deltaSessions: order.sessionCount,
      orderId: order.id,
      comment,
    });
  }

  async reserve(
    manager: EntityManager,
    relationId: string,
    order: CoachOrder,
    comment: string,
  ) {
    const relation = await this.lockRelation(manager, relationId);

    if (this.remaining(relation) <= 0) {
      throw new BadRequestException('No remaining sessions');
    }
    if (order.sessionsReserved + order.sessionsUsed >= order.sessionCount) {
      throw new ConflictException('Order has no free sessions');
    }

    relation.sessionsReserved += 1;
    order.sessionsReserved += 1;
    await manager.save(order);

    return this.persist(manager, relation, {
      type: ClientCoachTransactionType.SESSION_RESERVE,
      deltaSessions: -1,
      orderId: order.id,
      comment,
    });
  }

  async release(
    manager: EntityManager,
    relationId: string,
    orderId: string | null,
    comment: string,
  ) {
    const relation = await this.lockRelation(manager, relationId);

    if (relation.sessionsReserved <= 0) {
      throw new ConflictException('No reserved sessions to release');
    }

    relation.sessionsReserved -= 1;

    const order = await this.lockOrder(manager, orderId);
    if (order) {
      order.sessionsReserved -= 1;
      await manager.save(order);
    }

    return this.persist(manager, relation, {
      type: ClientCoachTransactionType.SESSION_RETURN,
      deltaSessions: 1,
      orderId,
      comment,
    });
  }

  async confirm(
    manager: EntityManager,
    relationId: string,
    orderId: string,
    comment: string,
  ) {
    const relation = await this.lockRelation(manager, relationId);

    if (relation.sessionsReserved <= 0) {
      throw new ConflictException('No reserved sessions to confirm');
    }

    const order = await this.lockOrder(manager, orderId);
    if (!order) throw new NotFoundException('Order not found');

    relation.sessionsReserved -= 1;
    relation.sessionsUsed += 1;
    order.sessionsReserved -= 1;
    order.sessionsUsed += 1;
    await manager.save(order);

    // Тренировка уже вычтена из remaining при брони, поэтому баланс не меняется.
    return this.persist(manager, relation, {
      type: ClientCoachTransactionType.SESSION_DEBIT,
      deltaSessions: 0,
      orderId,
      comment,
    });
  }

  private remaining(relation: ClientCoach) {
    return (
      relation.sessionsTotal - relation.sessionsUsed - relation.sessionsReserved
    );
  }

  private async lockRelation(manager: EntityManager, relationId: string) {
    const relation = await manager.findOne(ClientCoach, {
      where: { id: relationId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!relation) throw new NotFoundException('Relation not found');
    return relation;
  }

  private lockOrder(manager: EntityManager, orderId: string | null) {
    if (!orderId) return Promise.resolve(null);
    return manager.findOne(CoachOrder, {
      where: { id: orderId },
      lock: { mode: 'pessimistic_write' },
    });
  }

  /**
   * Сохраняет пару и пишет строку ledger.
   * Активность пары выводится из счётчиков в одном месте; `sessionsRemaining` база
   * пересчитывает сама и возвращает при сохранении.
   */
  private async persist(
    manager: EntityManager,
    relation: ClientCoach,
    entry: Pick<
      ClientCoachTransaction,
      'type' | 'deltaSessions' | 'orderId' | 'comment'
    >,
  ) {
    const remaining = this.remaining(relation);

    relation.isActive = remaining > 0 || relation.sessionsReserved > 0;
    if (relation.isActive) {
      relation.deactivatedAt = null;
    } else {
      relation.deactivatedAt = new Date();
    }

    await manager.save(relation);
    await manager.save(
      manager.create(ClientCoachTransaction, {
        clientCoachId: relation.id,
        balanceAfter: remaining,
        ...entry,
      }),
    );

    return relation;
  }
}
