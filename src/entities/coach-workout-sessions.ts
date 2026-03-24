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
import { User } from './user.entity';
import { CoachOrder } from './coach-order.entity';
import { TimeSlot } from './time-slot.entity';
import { ClientCoach } from './client-coach.entity';
import { CoachWorkoutSessionStatus } from '../config/emuns/coach-billing';

@Entity('coach_sessions')
@Index(['coachId', 'scheduledAt'])
@Index(['clientId', 'scheduledAt'])
@Index(['orderId'])
export class CoachWorkoutSessions {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  clientId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column('uuid')
  coachId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachId' })
  coach: User;

  @Column('uuid')
  clientCoachId: string;

  @ManyToOne(() => ClientCoach, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientCoachId' })
  clientCoach: ClientCoach;

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

  @Column({ type: 'numeric', precision: 12, scale: 2 })
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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
