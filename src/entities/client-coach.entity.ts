import { Entity, Column, ManyToOne, Unique, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { BaseEntity } from './base/base.entity';

@Entity('client_coach')
@Unique('uq_client_coach_pair', ['clientId', 'coachId'])
@Index('i_client_coach_coach', ['coachId'])
export class ClientCoach extends BaseEntity {
  @Column('uuid')
  clientId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId', referencedColumnName: 'id' })
  client: User;

  @Column('uuid')
  coachId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachId', referencedColumnName: 'id' })
  coach: User;

  // есть ли сейчас активное платное взаимодействие
  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  activatedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deactivatedAt?: Date;

  @Column({ type: 'int', default: 0 })
  sessionsTotal: number;

  @Column({ type: 'int', default: 0 })
  sessionsUsed: number;

  @Column({ type: 'int', default: 0 })
  sessionsRemaining: number;

  @Column({ type: 'int', default: 0 })
  sessionsReserved: number;

  @Column('int', { nullable: true })
  goalCalories?: number | null;

  @Column('int', { nullable: true })
  goalProtein?: number | null;

  @Column('int', { nullable: true })
  goalFat?: number | null;

  @Column('int', { nullable: true })
  goalCarbs?: number | null;
}
