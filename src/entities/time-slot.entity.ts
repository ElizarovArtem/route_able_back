import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { ClientCoach } from './client-coach.entity';
import { VideoLesson } from './video-lesson.entity';

export enum TimeSlotStatus {
  FREE = 'FREE',
  BOOKED = 'BOOKED',
  DISABLED = 'DISABLED',
}

@Entity('time_slots')
@Index('i_slot_by_coach_time', ['coachId', 'startAt', 'endAt'])
@Index('uq_slot_by_coach_time', ['coachId', 'startAt', 'endAt'], {
  unique: true,
})
export class TimeSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  coachId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachId' })
  coach: User;

  // слот может быть общим или для конкретной пары
  @Column('uuid', { nullable: true })
  clientCoachId: string | null;

  @ManyToOne(() => ClientCoach, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'clientCoachId' })
  relation?: ClientCoach | null;

  @Column('timestamptz')
  startAt: Date;

  @Column('timestamptz')
  endAt: Date;

  @Column({
    type: 'enum',
    enum: TimeSlotStatus,
    default: TimeSlotStatus.FREE,
  })
  status: TimeSlotStatus;

  @Column('uuid', { nullable: true })
  videoLessonId: string | null;

  @ManyToOne(() => VideoLesson, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'videoLessonId' })
  videoLesson?: VideoLesson | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'text', nullable: true })
  note?: string | null;
}
