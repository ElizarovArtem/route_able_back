import { Entity, Column, Index } from 'typeorm';
import { PairScopedEntity } from './base/pair-scoped.entity';
import { numericTransformer } from './base/transformers';

@Entity('planned_meals')
@Index('i_planned_by_relation_date', ['clientCoachId', 'date'])
export class PlannedMeal extends PairScopedEntity {
  @Column('text')
  text: string;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  calories?: number | null;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  protein?: number | null;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  fat?: number | null;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  carbs?: number | null;

  @Column({ type: 'boolean', default: false })
  isCompleted: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date | null;

  // Плановая дата (YYYY-MM-DD), без времени
  @Column({ type: 'date' }) date: string;

  // опционально: слот для удобства (можно убрать)
  @Column({
    type: 'enum',
    enum: ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'],
    nullable: true,
  })
  slot?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

  @Column('uuid') authorId: string; // тренер
}
