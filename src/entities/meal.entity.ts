import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
  Index,
  JoinColumn,
} from 'typeorm';
import { Day } from './day.entity';
import { PlannedMeal } from './planned-meal.entity';

@Entity('meals')
@Unique('uq_meal_planned_id', ['plannedMealId'])
@Index('i_meal_day_created_at', ['day', 'createdAt'])
export class Meal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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
  })
  calories: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
  })
  protein: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
  })
  fat: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
  })
  carbs: number;

  @CreateDateColumn()
  createdAt: Date;
}
