import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('trainee_coach')
@Unique('uq_tc_pair', ['traineeId', 'coachId'])
export class TraineeCoach {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column('uuid') traineeId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'traineeId', referencedColumnName: 'id' })
  trainee: User;

  @Column('uuid') coachId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachId', referencedColumnName: 'id' })
  coach: User;

  @CreateDateColumn() createdAt: Date;
}
