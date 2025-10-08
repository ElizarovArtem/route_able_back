import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ClientCoach } from './client-coach.entity';
import { PlannedExercise } from './planned-exercise.entity';
import { User } from './user.entity';

@Entity('exercise_logs')
@Unique('uq_log_by_planned', ['plannedExerciseId']) // 1 факт на 1 план (идемпотентность)
export class ExerciseLog {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column('uuid') clientCoachId: string;
  @ManyToOne(() => ClientCoach, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientCoachId' })
  relation: ClientCoach;

  @Column('uuid') clientId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column('uuid') coachId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachId' })
  coach: User;

  @Column('uuid') plannedExerciseId: string;
  @ManyToOne(() => PlannedExercise, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plannedExerciseId' })
  planned: PlannedExercise;

  @Column('uuid') authorId: string; // обычно клиент (нажал «выполнил»)

  @CreateDateColumn() createdAt: Date;
}
