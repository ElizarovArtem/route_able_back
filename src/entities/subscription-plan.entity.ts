import { Column, Entity, Index, OneToMany } from 'typeorm';
import {
  SubscriptionPeriod,
  SubscriptionPlanCode,
  SubscriptionPlanFeatures,
} from '../config/emuns/subscription';
import { UserSubscription } from './user-subscription.entity';
import { BaseEntity } from './base/base.entity';
import { numericTransformer } from './base/transformers';

@Entity('subscription_plans')
@Index(['code', 'period'], { unique: true })
export class SubscriptionPlan extends BaseEntity {
  @Column({
    type: 'enum',
    enum: SubscriptionPlanCode,
  })
  code: SubscriptionPlanCode;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
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
}
