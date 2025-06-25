import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  Unique,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Meal } from './meal.entity';

@Entity('days')
@Unique(['user', 'date'])
export class Day {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD

  @Column({ type: 'text', nullable: true })
  note?: string;

  @OneToMany(() => Meal, (meal) => meal.day, { cascade: true })
  meals: Meal[];

  @CreateDateColumn()
  createdAt: Date;
}
