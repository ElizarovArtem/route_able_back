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

@Entity('planned_meals')
@Index('i_planned_by_relation_date', ['clientCoachId', 'date'])
export class PlannedMeal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  clientCoachId: string;

  @ManyToOne(() => ClientCoach, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientCoachId' })
  relation: ClientCoach;

  @Column('uuid')
  clientId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column('uuid')
  coachId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachId' })
  coach: User;

  @Column('text')
  text: string;

  @Column('int', { nullable: true })
  calories?: number | null;

  @Column('int', { nullable: true })
  protein?: number | null;

  @Column('int', { nullable: true })
  fat?: number | null;

  @Column('int', { nullable: true })
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

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
  @Column('uuid') authorId: string; // тренер
}
