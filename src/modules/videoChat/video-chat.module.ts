import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientCoachModule } from '../clientCoach/clientCoach.module';
import { VideoChatController } from './video-chat.controller';
import { VideoChatService } from './video-chat.service';

@Module({
  imports: [ConfigModule, ClientCoachModule],
  controllers: [VideoChatController],
  providers: [VideoChatService],
  exports: [VideoChatService],
})
export class VideoChatModule {}
