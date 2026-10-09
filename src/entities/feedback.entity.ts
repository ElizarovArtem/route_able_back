import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { FeedbackType, FeedbackStatus } from '../config/emuns/feedback';
import { User } from './user.entity';
import { BaseEntity } from './base/base.entity';

@Entity('feedback')
@Index('i_feedback_status_created_at', ['status', 'createdAt'])
export class Feedback extends BaseEntity {
  @Column('uuid', { nullable: true })
  userId?: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user?: User | null;

  @Column({ type: 'enum', enum: FeedbackType })
  type: FeedbackType;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  contact?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  meta?: Record<string, any> | null;

  @Column({
    type: 'enum',
    enum: FeedbackStatus,
    default: FeedbackStatus.PENDING,
  })
  status: FeedbackStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  telegramMessageId?: string | null;

  @Column({ type: 'text', nullable: true })
  deliveryError?: string | null;
}
