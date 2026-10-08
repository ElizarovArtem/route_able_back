import { Column, Entity, Index } from 'typeorm';

import { VideoLessonStatus } from '../config/emuns/video-lesson';
import { PairScopedEntity } from './base/pair-scoped.entity';

@Entity('video_lessons')
@Index('i_lesson_by_pair_time', ['clientCoachId', 'startAt', 'endAt'])
export class VideoLesson extends PairScopedEntity {
  @Column('timestamptz')
  startAt: Date;

  @Column('timestamptz')
  endAt: Date;

  @Column({
    type: 'enum',
    enum: VideoLessonStatus,
    default: VideoLessonStatus.SCHEDULED,
  })
  status: VideoLessonStatus;

  @Column({ type: 'text', nullable: true })
  title?: string | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column('uuid')
  createdBy: string;
}
