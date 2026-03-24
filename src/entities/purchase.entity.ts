import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum PurchaseStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELED = 'CANCELED',
  REFUNDED = 'REFUNDED',
}

@Entity('purchases')
@Index(['buyerId', 'coachUserId'])
@Index(['buyerId', 'coachUserId', 'paidAt'])
export class Purchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  buyerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'buyerId' })
  buyer: User;

  @Column({ type: 'uuid' })
  coachUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachUserId' })
  coach: User;

  @Column({
    type: 'enum',
    enum: PurchaseStatus,
    default: PurchaseStatus.PENDING,
  })
  status: PurchaseStatus;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  canceledAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  refundedAt?: Date | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  amount?: number | null;

  @Column({ type: 'char', length: 3, nullable: true })
  currency?: string | null;

  @Column({ nullable: true })
  provider?: string | null;

  @Index({ unique: true })
  @Column({ nullable: true })
  providerPaymentId?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
