import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Day } from './day.entity';

@Entity('meals')
export class Meal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Day, (day) => day.meals, { onDelete: 'CASCADE' })
  day: Day;

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
