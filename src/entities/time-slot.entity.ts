import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { BaseEntity } from './base/base.entity';

export enum TimeSlotStatus {
  FREE = 'FREE',
  BOOKED = 'BOOKED',
  DISABLED = 'DISABLED',
}

@Entity('time_slots')
@Index('uq_slot_by_coach_time', ['coachId', 'startAt', 'endAt'], {
  unique: true,
})
export class TimeSlot extends BaseEntity {
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

  @Column({ type: 'text', nullable: true })
  note?: string | null;
}
