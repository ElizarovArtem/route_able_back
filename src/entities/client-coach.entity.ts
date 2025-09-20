import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('client_coach')
@Unique('uq_client_coach_pair', ['clientId', 'coachId'])
export class ClientCoach {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column('uuid') clientId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId', referencedColumnName: 'id' })
  client: User;

  @Column('uuid') coachId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachId', referencedColumnName: 'id' })
  coach: User;

  @CreateDateColumn() createdAt: Date;

  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  activatedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deactivatedAt?: Date;

  @Column('int', { nullable: true })
  goalCalories?: number | null;

  @Column('int', { nullable: true })
  goalProtein?: number | null;

  @Column('int', { nullable: true })
  goalFat?: number | null;

  @Column('int', { nullable: true })
  goalCarbs?: number | null;
}
