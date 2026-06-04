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
import { FeedbackType, FeedbackStatus } from '../config/emuns/feedback';
import { User } from './user.entity';

@Entity('feedback')
@Index('i_feedback_created_at', ['createdAt'])
@Index('i_feedback_status', ['status'])
@Index('i_feedback_type', ['type'])
export class Feedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
