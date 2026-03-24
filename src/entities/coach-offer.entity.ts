import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum CoachOfferType {
  SINGLE_SESSION = 'SINGLE_SESSION',
  SESSION_PACK = 'SESSION_PACK',
}

@Entity('coach_offers')
@Index(['coachId', 'isActive'])
export class CoachOffer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  coachId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachId', referencedColumnName: 'id' })
  coach: User;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'enum', enum: CoachOfferType })
  type: CoachOfferType;

  @Column({ type: 'int', default: 1 })
  sessionCount: number; // 1 для разового, >1 для пакета

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  price: number;

  @Column({ type: 'char', length: 3, default: 'RUB' })
  currency: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
