import { Entity, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { PlannedExercise } from './planned-exercise.entity';
import { PairScopedEntity } from './base/pair-scoped.entity';

@Entity('exercise_logs')
@Unique('uq_log_by_planned', ['plannedExerciseId']) // 1 факт на 1 план (идемпотентность)
@Index('i_exercise_log_pair_created_at', ['clientCoachId', 'createdAt'])
export class ExerciseLog extends PairScopedEntity {
  @Column('uuid') plannedExerciseId: string;
  @ManyToOne(() => PlannedExercise, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plannedExerciseId' })
  planned: PlannedExercise;

  @Column('uuid') authorId: string; // обычно клиент (нажал «выполнил»)
}
