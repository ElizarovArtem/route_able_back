import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Meal } from './meal.entity';
import { ClientCoach } from './client-coach.entity';

@Entity('days')
@Index('uq_day_personal', ['userId', 'date'], {
  unique: true,
  // уникальность для личных дней (когда нет пары)
  where: 'client_coach_id IS NULL',
})
@Index('uq_day_pair', ['userId', 'date', 'clientCoachId'], {
  unique: true,
  // уникальность для дней внутри пары
  where: 'client_coach_id IS NOT NULL',
})
export class Day {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // явная FK-колонка на пользователя
  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, (user) => user.days, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // nullable: NULL = личный день, не NULL = день в рамках пары client↔coach
  @Column('uuid', { name: 'client_coach_id', nullable: true })
  clientCoachId: string | null;

  @ManyToOne(() => ClientCoach, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'client_coach_id' })
  relation?: ClientCoach | null;

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD

  @Column({ type: 'text', nullable: true })
  note?: string;

  @OneToMany(() => Meal, (meal) => meal.day, { cascade: true })
  meals: Meal[];

  @CreateDateColumn()
  createdAt: Date;
}
