import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ClientCoach } from './client-coach.entity';
import { CoachOrder } from './coach-order.entity';
import { ClientCoachTransactionType } from '../config/emuns/coach-billing';
import { BaseEntity } from './base/base.entity';

@Entity('client_coach_transactions')
@Index(['clientCoachId', 'createdAt'])
export class ClientCoachTransaction extends BaseEntity {
  @Column('uuid')
  clientCoachId: string;

  @ManyToOne(() => ClientCoach, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientCoachId', referencedColumnName: 'id' })
  clientCoach: ClientCoach;

  @Column({ type: 'enum', enum: ClientCoachTransactionType })
  type: ClientCoachTransactionType;

  @Column({ type: 'int' })
  deltaSessions: number;

  @Column({ type: 'int' })
  balanceAfter: number;

  @Column('uuid', { nullable: true })
  orderId?: string | null;

  @ManyToOne(() => CoachOrder, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'orderId', referencedColumnName: 'id' })
  order?: CoachOrder | null;

  @Column({ type: 'text', nullable: true })
  comment?: string | null;
}
