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

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'text', nullable: true })
  note?: string | null;
}
