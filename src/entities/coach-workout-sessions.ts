import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { CoachOrder } from './coach-order.entity';
import { TimeSlot } from './time-slot.entity';
import { CoachWorkoutSessionStatus } from '../config/emuns/coach-billing';
import { PairScopedEntity } from './base/pair-scoped.entity';
import { numericTransformer } from './base/transformers';

@Entity('coach_sessions')
@Index(['coachId', 'scheduledAt'])
@Index(['clientId', 'scheduledAt'])
@Index(['orderId'])
@Index('uq_session_active_slot', ['timeSlotId'], {
  unique: true,
  where: `"status" = 'BOOKED'`,
})
export class CoachWorkoutSessions extends PairScopedEntity {
  @Column('uuid')
  orderId: string;

  @ManyToOne(() => CoachOrder, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'orderId' })
  order: CoachOrder;

  @Column('uuid')
  timeSlotId: string;

  @ManyToOne(() => TimeSlot, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'timeSlotId' })
  timeSlot: TimeSlot;

  @Column('timestamptz')
  scheduledAt: Date;

  @Column({ type: 'int' })
  durationMinutes: number;

  @Column({
    type: 'enum',
    enum: CoachWorkoutSessionStatus,
    default: CoachWorkoutSessionStatus.BOOKED,
  })
  status: CoachWorkoutSessionStatus;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: numericTransformer,
  })
  price: number;

  @Column({ type: 'char', length: 3, default: 'RUB' })
  currency: string;

  @Column({ type: 'timestamptz', nullable: true })
  coachMarkedCompletedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  clientConfirmedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  autoConfirmedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  disputedAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  cancelReason?: string | null;

  @Column({ type: 'text', nullable: true })
  disputeReason?: string | null;
}
