import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from '../../entities/chat.entity';
import { ChatParticipant } from '../../entities/chat-participant.entity';
import { Message } from '../../entities/message.entity';
import { ClientCoach } from '../../entities/client-coach.entity';
import { User } from '../../entities/user.entity'; // ⬅️ путь
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ClientCoachService } from '../clientCoach/clientCoach.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Chat,
      ChatParticipant,
      Message,
      ClientCoach,
      User,
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService, ClientCoachService],
  exports: [ChatService],
})
export class ChatModule {}
