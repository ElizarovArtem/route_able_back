import { Entity, Column, OneToMany } from 'typeorm';
import { Day } from './day.entity';
import { ActivityLevel, Gender, Roles, WeightGoal } from '../config/emuns/user';
import { BaseEntity } from './base/base.entity';
import { numericTransformer } from './base/transformers';

@Entity('users')
export class User extends BaseEntity {
  @Column({ nullable: true })
  name: string;

  // 🔹 Рост в сантиметрах
  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  height?: number | null;

  // 🔹 Вес в килограммах
  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  weight?: number | null;

  // 🔹 Процент жира в теле (18.5 = 18.5%)
  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  bodyFatPercent?: number | null;

  // 🔹 Пол
  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender?: Gender | null;

  // 🔹 Дата рождения (для расчёта возраста)
  @Column({ type: 'date', nullable: true })
  birthDate?: string | null;

  // 🔹 Уровень активности
  @Column({ type: 'enum', enum: ActivityLevel, nullable: true })
  activityLevel?: ActivityLevel | null;

  // 🔹 Цель по весу (похудеть / поддерживать / набрать)
  @Column({ type: 'enum', enum: WeightGoal, nullable: true })
  weightGoal?: WeightGoal | null;

  @Column('text', { array: true, default: () => `'{${Roles.Client}}'` })
  roles: Roles[];

  @Column({ nullable: true, unique: true })
  phone: string;

  @Column({ nullable: true, unique: true })
  email: string;

  @Column({ nullable: true })
  about: string;

  @Column({ default: false })
  isCoachAgreed: boolean;

  @OneToMany(() => Day, (day) => day.user, { onDelete: 'CASCADE' })
  days: Day[];

  @Column({ nullable: true })
  avatar?: string;

  // 🔹 ЛИЧНЫЕ ЦЕЛИ КБЖУ (numeric)
  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  personalGoalCalories?: number | null;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  personalGoalProtein?: number | null;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  personalGoalFat?: number | null;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  personalGoalCarbs?: number | null;
}
