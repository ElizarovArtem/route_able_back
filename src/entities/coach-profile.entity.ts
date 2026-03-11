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
  @Index()
  @Column({ type: 'int', default: 0 })
  ratingSum: number;

  @Index()
  @Column({ type: 'int', default: 0 })
  ratingCount: number;

  @Index()
  @Column({ type: 'numeric', precision: 3, scale: 2, default: 0 })
  ratingAvg: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
