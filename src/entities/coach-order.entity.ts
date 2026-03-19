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
import { CoachOffer } from './coach-offer.entity';
import { CoachOrderStatus } from '../config/emuns/coach-billing';
import { ClientCoach } from './client-coach.entity';

@Entity('coach_orders')
@Index(['clientId', 'coachId'])
@Index(['coachId', 'status'])
export class CoachOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column('uuid')
  offerId: string;

  @ManyToOne(() => CoachOffer, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'offerId', referencedColumnName: 'id' })
  offer: CoachOffer;

  @Column({
    type: 'enum',
    enum: CoachOrderStatus,
    default: CoachOrderStatus.CREATED,
  })
  status: CoachOrderStatus;

  @Column({ type: 'int' })
  sessionCount: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'char', length: 3, default: 'RUB' })
  currency: string;

  @Column({ nullable: true })
  paymentProvider?: string | null;

  @Column({ nullable: true, unique: true })
  paymentExternalId?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  canceledAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  refundedAt?: Date | null;

  @Column('uuid')
  clientCoachId: string;

  @ManyToOne(() => ClientCoach, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientCoachId', referencedColumnName: 'id' })
  clientCoach: ClientCoach;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
