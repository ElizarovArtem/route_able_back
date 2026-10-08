import { Entity, Column, OneToMany, ManyToOne, Index } from 'typeorm';
import { ChatParticipant } from './chat-participant.entity';
import { Message } from './message.entity';
import { ClientCoach } from './client-coach.entity';
import { BaseEntity } from './base/base.entity';

@Entity('chats')
@Index('uq_chat_client_coach', ['clientCoachId'], { unique: true })
export class Chat extends BaseEntity {
  // Один чат на конкретную пару client↔coach
  @Column({ nullable: true }) clientCoachId?: string;
  @ManyToOne(() => ClientCoach, { nullable: true, onDelete: 'SET NULL' })
  clientCoach?: ClientCoach;

  @OneToMany(() => ChatParticipant, (p) => p.chat)
  participants: ChatParticipant[];
  @OneToMany(() => Message, (m) => m.chat) messages: Message[];
}
