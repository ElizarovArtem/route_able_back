import { Column, JoinColumn, ManyToOne } from 'typeorm';

import { ClientCoach } from '../client-coach.entity';
import { User } from '../user.entity';
import { BaseEntity } from './base.entity';

/**
 * Запись, привязанная к паре клиент↔тренер.
 * `clientId` и `coachId` денормализованы из `ClientCoach` для быстрых фильтров и проверки прав.
 */
export abstract class PairScopedEntity extends BaseEntity {
  @Column('uuid')
  clientCoachId: string;

  @ManyToOne(() => ClientCoach, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientCoachId' })
  clientCoach: ClientCoach;

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
}
