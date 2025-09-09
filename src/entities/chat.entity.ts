import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { ChatParticipant } from './chat-participant.entity';
import { Message } from './message.entity';
import { ClientCoach } from './client-coach.entity';

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn('uuid') id: string;

  // Один чат на конкретную пару client↔coach
  @Column({ nullable: true }) clientCoachId?: string;
  @ManyToOne(() => ClientCoach, { nullable: true, onDelete: 'SET NULL' })
  clientCoach?: ClientCoach;

  @OneToMany(() => ChatParticipant, (p) => p.chat)
  participants: ChatParticipant[];
  @OneToMany(() => Message, (m) => m.chat) messages: Message[];
}
