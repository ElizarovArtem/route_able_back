import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Check,
  Exclusion,
} from 'typeorm';
import { User } from './user.entity';
import { BaseEntity } from './base/base.entity';

export enum TimeSlotStatus {
  FREE = 'FREE',
  BOOKED = 'BOOKED',
  DISABLED = 'DISABLED',
}

@Entity('time_slots')
@Check('chk_time_slot_range', `"endAt" > "startAt"`)
@Exclusion(
  'no_slot_overlap',
  `USING gist ("coachId" WITH =, tstzrange("startAt", "endAt") WITH &&) WHERE ("status" <> 'DISABLED')`,
)
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
