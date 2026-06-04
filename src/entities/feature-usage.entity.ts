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
import { PaidFeature } from '../config/emuns/subscription';

@Entity('feature_usage')
@Index(['userId'])
@Index(['feature'])
@Index(['periodStart'])
@Index(['periodEnd'])
@Index(['userId', 'feature', 'periodStart', 'periodEnd'], { unique: true })
export class FeatureUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
