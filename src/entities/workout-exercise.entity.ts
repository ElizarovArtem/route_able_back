import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { WorkoutSession } from './workout-session.entity';
import { ExerciseKey, WorkoutExerciseStatus } from '../config/emuns/ai-workout';
import { BaseEntity } from './base/base.entity';

@Entity('workout_exercises')
@Index('i_workout_exercise_session_order', ['sessionId', 'order'])
export class WorkoutExercise extends BaseEntity {
  @Column('uuid')
  sessionId: string;

  @ManyToOne(() => WorkoutSession, (s) => s.exercises, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: WorkoutSession;

  @Column('int')
  order: number;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  targetMuscle?: string | null;

  @Column({ type: 'int' })
  setsPlanned: number;

  @Column({ type: 'int' })
  repsPerSet: number;

  @Column({ type: 'int', nullable: true })
  restSeconds?: number | null;

  @Column({ type: 'int', default: 0 })
  setsCompleted: number;

  @Column({
    type: 'enum',
    enum: WorkoutExerciseStatus,
    default: WorkoutExerciseStatus.PENDING,
  })
  status: WorkoutExerciseStatus;

  // ключ для LiveKit/pose
  @Column({ type: 'enum', enum: ExerciseKey, nullable: true })
  exerciseKey?: ExerciseKey | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;
}
