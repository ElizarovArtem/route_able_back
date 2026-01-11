import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from '../../entities/chat.entity';
import { ChatParticipant } from '../../entities/chat-participant.entity';
import { Message } from '../../entities/message.entity';
import { ClientCoach } from '../../entities/client-coach.entity';
import { User } from '../../entities/user.entity';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ClientCoachModule } from '../clientCoach/clientCoach.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Chat,
      ChatParticipant,
      Message,
      ClientCoach,
      User,
    ]),
    ClientCoachModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
