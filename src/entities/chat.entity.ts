import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { ChatParticipant } from './chat-participant.entity';
import { Message } from './message.entity';
import { TraineeCoach } from './trainee-coach.entity';

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn('uuid') id: string;

  // Один чат на конкретную пару trainee↔coach
  @Column({ nullable: true }) traineeCoachId?: string;
  @ManyToOne(() => TraineeCoach, { nullable: true, onDelete: 'SET NULL' })
  traineeCoach?: TraineeCoach;

  @OneToMany(() => ChatParticipant, (p) => p.chat)
  participants: ChatParticipant[];
  @OneToMany(() => Message, (m) => m.chat) messages: Message[];
}
