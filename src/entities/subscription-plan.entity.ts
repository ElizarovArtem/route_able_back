import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  SubscriptionPeriod,
  SubscriptionPlanCode,
  SubscriptionPlanFeatures,
} from '../config/emuns/subscription';
import { UserSubscription } from './user-subscription.entity';

@Entity('subscription_plans')
@Index(['code', 'period'], { unique: true })
@Index(['isActive'])
@Index(['sortOrder'])
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: SubscriptionPlanCode,
  })
  code: SubscriptionPlanCode;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  price: string;

  @Column({ type: 'char', length: 3, default: 'RUB' })
  currency: string;

  @Column({
    type: 'enum',
    enum: SubscriptionPeriod,
  })
  period: SubscriptionPeriod;

  @Column({ type: 'jsonb', default: {} })
  features: SubscriptionPlanFeatures;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @OneToMany(() => UserSubscription, (subscription) => subscription.plan)
  subscriptions: UserSubscription[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
