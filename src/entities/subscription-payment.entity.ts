import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { UserSubscription } from './user-subscription.entity';
import {
  SubscriptionPaymentProvider,
  SubscriptionPaymentStatus,
} from '../config/emuns/subscription';

@Entity('subscription_payments')
@Index(['userId'])
@Index(['userSubscriptionId'])
@Index(['provider'])
@Index(['status'])
@Index(['externalPaymentId'])
export class SubscriptionPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: User;

  @Column('uuid', { nullable: true })
  userSubscriptionId?: string | null;

  @ManyToOne(() => UserSubscription, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'userSubscriptionId', referencedColumnName: 'id' })
  userSubscription?: UserSubscription | null;

  @Column({
    type: 'enum',
    enum: SubscriptionPaymentProvider,
    default: SubscriptionPaymentProvider.STUB,
  })
  provider: SubscriptionPaymentProvider;

  @Column({
    type: 'enum',
    enum: SubscriptionPaymentStatus,
    default: SubscriptionPaymentStatus.PENDING,
  })
  status: SubscriptionPaymentStatus;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: string;

  @Column({ type: 'char', length: 3, default: 'RUB' })
  currency: string;

  @Column({ nullable: true })
  externalPaymentId?: string | null;

  @Column({ nullable: true })
  externalInvoiceId?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  failureReason?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  rawPayload?: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
