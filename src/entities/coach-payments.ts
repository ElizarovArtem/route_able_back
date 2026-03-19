import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { CoachOrder } from './coach-order.entity';
import { User } from './user.entity';
import { ClientCoach } from './client-coach.entity';
import {
  CoachPaymentType,
  CoachPaymentStatus,
} from '../config/emuns/coach-billing';
import { CoachWorkoutSessions } from './coach-workout-sessions';

@Entity('coach_payments')
@Index(['orderId', 'type'])
@Index(['coachId', 'type', 'status'])
@Index(['clientId', 'type', 'status'])
@Index(['provider', 'providerExternalId'], { unique: false })
export class CoachPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  clientCoachId: string;

  @ManyToOne(() => ClientCoach, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientCoachId', referencedColumnName: 'id' })
  clientCoach: ClientCoach;

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

  @Column('uuid')
  clientId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId', referencedColumnName: 'id' })
  client: User;

  @Column('uuid')
  coachId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachId', referencedColumnName: 'id' })
  coach: User;

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

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  platformFee: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  coachAmount: string;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
