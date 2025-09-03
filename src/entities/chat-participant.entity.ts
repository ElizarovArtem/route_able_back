import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
} from 'typeorm';
import { Chat } from './chat.entity';
import { User } from './user.entity';

@Entity('chat_participants')
@Unique('u_chat_user', ['chatId', 'userId'])
export class ChatParticipant {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column() chatId: string;
  @ManyToOne(() => Chat, (c) => c.participants, { onDelete: 'CASCADE' })
  chat: Chat;

  @Column() userId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) user: User;
}
