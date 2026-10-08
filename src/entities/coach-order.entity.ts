import { Entity, Column, ManyToOne, JoinColumn, Index, Check } from 'typeorm';
import { CoachOffer } from './coach-offer.entity';
import { CoachOrderStatus } from '../config/emuns/coach-billing';
import { PairScopedEntity } from './base/pair-scoped.entity';
import { numericTransformer } from './base/transformers';

@Entity('coach_orders')
@Check(
  'chk_coach_order_sessions_within_count',
  `"sessionsUsed" >= 0 AND "sessionsReserved" >= 0 AND "sessionsUsed" + "sessionsReserved" <= "sessionCount"`,
)
@Index(['clientId', 'coachId'])
@Index(['coachId', 'status'])
export class CoachOrder extends PairScopedEntity {
  @Column('uuid')
  offerId: string;

  @ManyToOne(() => CoachOffer, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'offerId', referencedColumnName: 'id' })
  offer: CoachOffer;

  @Column({
    type: 'enum',
    enum: CoachOrderStatus,
    default: CoachOrderStatus.CREATED,
  })
  status: CoachOrderStatus;

  @Column({ type: 'int' })
  sessionCount: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: numericTransformer,
  })
  amount: number;

  @Column({ type: 'char', length: 3, default: 'RUB' })
  currency: string;

  @Column({ type: 'int', default: 0 })
  sessionsUsed: number;

  @Column({ type: 'int', default: 0 })
  sessionsReserved: number;

  @Column({ nullable: true })
  paymentProvider?: string | null;

  @Column({ nullable: true, unique: true })
  paymentExternalId?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  canceledAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  refundedAt?: Date | null;
}
