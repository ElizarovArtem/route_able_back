import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('coach_profiles')
@Index('i_coach_profile_public_rating', ['ratingAvg'], {
  where: '"isPublic" = true',
})
export class CoachProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ type: 'numeric', precision: 3, scale: 2, default: 0 })
  ratingAvg: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
