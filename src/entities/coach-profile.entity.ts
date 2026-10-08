import { Entity, Column, OneToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { BaseEntity } from './base/base.entity';
import { numericTransformer } from './base/transformers';

@Entity('coach_profiles')
@Index('i_coach_profile_public_rating', ['ratingAvg'], {
  where: '"isPublic" = true',
})
export class CoachProfile extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'uuid' })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ default: true })
  isPublic: boolean;

  // агрегаты
  @Column({ type: 'int', default: 0 })
  ratingSum: number;

  @Column({ type: 'int', default: 0 })
  ratingCount: number;

  @Column({
    type: 'numeric',
    precision: 3,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  ratingAvg: number;
}
