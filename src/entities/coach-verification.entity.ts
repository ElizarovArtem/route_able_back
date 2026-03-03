import { CoachVerificationStatus } from 'src/config/emuns/coach-verification';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('coach_verification')
@Index(['userId'], { unique: true })
export class CoachVerificationRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 500 })
  contactInfo: string;

  @Column({
    type: 'enum',
    enum: CoachVerificationStatus,
    default: CoachVerificationStatus.PENDING,
  })
  status: CoachVerificationStatus;

  @Column({ type: 'uuid', nullable: true })
  reviewedByAdminId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
