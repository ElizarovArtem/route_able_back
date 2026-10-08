import { Entity, Column, ManyToOne, Unique, Index } from 'typeorm';
import { Chat } from './chat.entity';
import { User } from './user.entity';
import { BaseEntity } from './base/base.entity';

@Entity('chat_participants')
@Unique('u_chat_user', ['chatId', 'userId'])
@Index('i_chat_participant_user', ['userId'])
export class ChatParticipant extends BaseEntity {
  @Column() chatId: string;
  @ManyToOne(() => Chat, (c) => c.participants, { onDelete: 'CASCADE' })
  chat: Chat;

  @Column() userId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) user: User;
}
