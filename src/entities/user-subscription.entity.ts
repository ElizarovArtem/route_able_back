import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { SubscriptionPlan } from './subscription-plan.entity';
import { SubscriptionStatus } from '../config/emuns/subscription';
import { SubscriptionPayment } from './subscription-payment.entity';

@Entity('user_subscriptions')
@Index(['userId'])
@Index(['status'])
@Index(['endAt'])
@Index(['externalSubscriptionId'])
export class UserSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: User;

  @Column('uuid')
  planId: string;

  @ManyToOne(() => SubscriptionPlan, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'planId', referencedColumnName: 'id' })
  plan: SubscriptionPlan;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING,
  })
  status: SubscriptionStatus;

  @Column({ type: 'timestamptz', nullable: true })
  startAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  endAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  trialEndsAt?: Date | null;

  @Column({ default: false })
  cancelAtPeriodEnd: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  canceledAt?: Date | null;

  @Column({ nullable: true })
  externalCustomerId?: string | null;

  @Column({ nullable: true })
  externalSubscriptionId?: string | null;

  @OneToMany(() => SubscriptionPayment, (payment) => payment.userSubscription)
  payments: SubscriptionPayment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
