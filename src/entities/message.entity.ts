import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Chat } from './chat.entity';
import { User } from './user.entity';

@Entity('messages')
@Index('i_message_chat_created_at', ['chatId', 'createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column() chatId: string;
  @ManyToOne(() => Chat, (c) => c.messages, { onDelete: 'CASCADE' }) chat: Chat;

  @Column() authorId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) author: User;

  @Column('text') text: string;

  @CreateDateColumn() createdAt: Date;
}
