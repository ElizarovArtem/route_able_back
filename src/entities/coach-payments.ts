import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { CoachOrder } from './coach-order.entity';
import {
  CoachPaymentType,
  CoachPaymentStatus,
} from '../config/emuns/coach-billing';
import { CoachWorkoutSessions } from './coach-workout-sessions';
import { PairScopedEntity } from './base/pair-scoped.entity';
import { numericTransformer } from './base/transformers';

@Entity('coach_payments')
@Index(['orderId', 'type'])
@Index(['coachId', 'type', 'status'])
@Index(['clientId', 'type', 'status'])
@Index(['provider', 'providerExternalId'], { unique: true })
export class CoachPayment extends PairScopedEntity {
  @Column('uuid')
  orderId: string;

  @ManyToOne(() => CoachOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId', referencedColumnName: 'id' })
  order: CoachOrder;

  @Column('uuid', { nullable: true })
  coachSessionId?: string | null;

  @ManyToOne(() => CoachWorkoutSessions, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'coachSessionId', referencedColumnName: 'id' })
  coachSession?: CoachWorkoutSessions | null;

  @Column({
    type: 'enum',
    enum: CoachPaymentType,
  })
  type: CoachPaymentType;

  @Column({
    type: 'enum',
    enum: CoachPaymentStatus,
    default: CoachPaymentStatus.CREATED,
  })
  status: CoachPaymentStatus;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: numericTransformer,
  })
  amount: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  platformFee: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  coachAmount: number;

  @Column({ type: 'char', length: 3, default: 'RUB' })
  currency: string;

  @Column({ nullable: true })
  provider?: string | null;

  @Column({ nullable: true })
  providerExternalId?: string | null;

  @Column({ nullable: true })
  providerOperationId?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  providerMeta?: Record<string, any> | null;

  @Column({ type: 'text', nullable: true })
  failReason?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  heldAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  readyForPayoutAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  paidOutAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  refundedAt?: Date | null;
}
