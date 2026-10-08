import { Entity, Column, ManyToOne, Index, Check, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { BaseEntity } from './base/base.entity';

@Entity('coach_reviews')
@Check(`"rating" >= 1 AND "rating" <= 5`)
@Index(['authorId', 'coachUserId'], { unique: true })
@Index(['coachUserId', 'createdAt'])
export class CoachReview extends BaseEntity {
  @Column({ type: 'uuid' })
  coachUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachUserId' })
  coach: User;

  @Column({ type: 'uuid' })
  authorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  text?: string | null;

  @Column({ type: 'boolean', default: true })
  isVerified: boolean;
}
