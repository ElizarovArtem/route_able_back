import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from '../../entities/chat.entity';
import { ChatParticipant } from '../../entities/chat-participant.entity';
import { Message } from '../../entities/message.entity';
import { ClientCoach } from '../../entities/client-coach.entity';
import { User } from '../../entities/user.entity'; // ⬅️ путь
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { RelationsService } from '../relations/relations.service';

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
  providers: [ChatService, RelationsService],
  exports: [ChatService],
})
export class ChatModule {}
