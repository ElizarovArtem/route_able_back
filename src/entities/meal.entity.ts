import { Entity, Column, ManyToOne, Unique, Index, JoinColumn } from 'typeorm';
import { Day } from './day.entity';
import { PlannedMeal } from './planned-meal.entity';
import { BaseEntity } from './base/base.entity';
import { numericTransformer } from './base/transformers';

@Entity('meals')
@Unique('uq_meal_planned_id', ['plannedMealId'])
@Index('i_meal_day_created_at', ['day', 'createdAt'])
export class Meal extends BaseEntity {
  @ManyToOne(() => Day, (day) => day.meals, { onDelete: 'CASCADE' })
  day: Day;

  @Column('uuid', { nullable: true })
  clientCoachId: string | null;

  @Column('uuid', { nullable: true })
  plannedMealId?: string | null;

  @ManyToOne(() => PlannedMeal, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'plannedMealId' })
  plannedMeal?: PlannedMeal;

  @Column()
  name: string;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: numericTransformer,
  })
  calories: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: numericTransformer,
  })
  protein: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: numericTransformer,
  })
  fat: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: numericTransformer,
  })
  carbs: number;
}
