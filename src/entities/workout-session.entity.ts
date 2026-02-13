import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { WorkoutExercise } from './workout-exercise.entity';
import { WorkoutStatus } from '../config/emuns/ai-workout';

@Index(['userId', 'date'])
@Index(['userId', 'sourceSessionId'])
@Entity('workout_sessions')
export class WorkoutSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD

  @Column({ type: 'enum', enum: WorkoutStatus, default: WorkoutStatus.PLANNED })
  status: WorkoutStatus;

  // описание/намерение пользователя на момент генерации
  @Column({ type: 'text', nullable: true })
  userIntent?: string | null;

  @Column({ type: 'int', nullable: true })
  energyLevel?: number | null;

  @Column({ type: 'int', nullable: true })
  sleepQuality?: number | null;

  @Column({ type: 'int', nullable: true })
  nutritionQuality?: number | null;

  // snapshot цели на момент генерации/повтора
  @Column({ type: 'text', nullable: true })
  weightGoalSnapshot?: string | null;

  // необязательный snapshot ответа от модели
  @Column({ type: 'jsonb', nullable: true })
  modelRaw?: any;

  // ⚡ откуда была скопирована эта тренировка (для "повторить")
  @Column('uuid', { nullable: true })
  sourceSessionId?: string | null;

  @OneToMany(() => WorkoutExercise, (exercise) => exercise.session, {
    cascade: true,
  })
  exercises: WorkoutExercise[];

  @Column({ type: 'int', default: 0 })
  currentExerciseIndex: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
