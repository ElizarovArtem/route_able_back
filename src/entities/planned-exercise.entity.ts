import { Entity, Column, Index } from 'typeorm';
import { PairScopedEntity } from './base/pair-scoped.entity';
import { numericTransformer } from './base/transformers';

@Entity('planned_exercises')
@Index('i_planned_ex_by_relation_date', ['clientCoachId', 'date'])
export class PlannedExercise extends PairScopedEntity {
  // якорь — конкретная пара client↔coach
  // денормализация для быстрых фильтров/прав
  // дата, к которой привязан план (без времени)
  @Column({ type: 'date' }) date: string;

  // само упражнение
  @Column('text') name: string; // название упражнения
  @Column('int') sets: number; // количество подходов
  @Column('int') reps: number; // количество повторений
  @Column({
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  workingWeight: number;

  // опционально: порядок и заметки
  @Column('int', { nullable: true }) order?: number | null;
  @Column('text', { nullable: true }) notes?: string | null;

  // кто назначил (обычно тренер)
  @Column('uuid') authorId: string;
}
