import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { ClientCoach } from './client-coach.entity';
import { User } from './user.entity';

const decimal2 = {
  to: (v?: number | null) => (v == null ? null : v.toFixed(2)), // в БД строкой "82.50"
  from: (v?: string | null) => (v == null ? null : Number(v)), // из БД числом 82.5
};

@Entity('planned_exercises')
@Index('i_planned_ex_by_relation_date', ['clientCoachId', 'date'])
export class PlannedExercise {
  @PrimaryGeneratedColumn('uuid') id: string;

  // якорь — конкретная пара client↔coach
  @Column('uuid') clientCoachId: string;
  @ManyToOne(() => ClientCoach, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientCoachId' })
  relation: ClientCoach;

  // денормализация для быстрых фильтров/прав
  @Column('uuid') clientId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column('uuid') coachId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachId' })
  coach: User;

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
    transformer: decimal2,
  })
  workingWeight: number;

  // опционально: порядок и заметки
  @Column('int', { nullable: true }) order?: number | null;
  @Column('text', { nullable: true }) notes?: string | null;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;

  // кто назначил (обычно тренер)
  @Column('uuid') authorId: string;
}
