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

  @Column({ type: 'int' })
  calories: number;

  @Column({ type: 'int' })
  protein: number;

  @Column({ type: 'int' })
  fat: number;

  @Column({ type: 'int' })
  carbs: number;

  @CreateDateColumn()
  createdAt: Date;
}
