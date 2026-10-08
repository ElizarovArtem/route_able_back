import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { PaidFeature } from '../config/emuns/subscription';
import { BaseEntity } from './base/base.entity';

@Entity('feature_usage')
@Index(['userId', 'feature', 'periodStart', 'periodEnd'], { unique: true })
export class FeatureUsage extends BaseEntity {
  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: User;

  @Column({
    type: 'enum',
    enum: PaidFeature,
  })
  feature: PaidFeature;

  @Column({ type: 'timestamptz' })
  periodStart: Date;

  @Column({ type: 'timestamptz' })
  periodEnd: Date;

  @Column({ type: 'int', default: 0 })
  used: number;

  @Column({ type: 'int', default: 0 })
  limit: number;
}
