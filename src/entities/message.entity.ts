import { Entity, Column, ManyToOne, Index } from 'typeorm';
import { Chat } from './chat.entity';
import { User } from './user.entity';
import { BaseEntity } from './base/base.entity';

@Entity('messages')
@Index('i_message_chat_created_at', ['chatId', 'createdAt'])
export class Message extends BaseEntity {
  @Column() chatId: string;
  @ManyToOne(() => Chat, (c) => c.messages, { onDelete: 'CASCADE' }) chat: Chat;

  @Column() authorId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) author: User;

  @Column('text') text: string;
}
