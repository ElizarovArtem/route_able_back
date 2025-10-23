import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ClientCoach } from './client-coach.entity';
import { User } from './user.entity';

export enum LessonStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
}

@Entity('video_lessons')
@Index('i_lesson_by_pair_time', ['clientCoachId', 'startAt', 'endAt'])
export class VideoLesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  clientCoachId: string;

  @ManyToOne(() => ClientCoach, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientCoachId' })
  relation: ClientCoach;

  @Column('uuid')
  clientId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column('uuid')
  coachId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachId' })
  coach: User;

  @Column('timestamptz')
  startAt: Date;

  @Column('timestamptz')
  endAt: Date;

  @Column({ type: 'enum', enum: LessonStatus, default: LessonStatus.SCHEDULED })
  status: LessonStatus;

  @Column({ type: 'text', nullable: true })
  title?: string | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column('uuid')
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
