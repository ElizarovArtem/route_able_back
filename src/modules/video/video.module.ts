import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VideoController } from './video.controller';
import { VideoChatService } from './videoChat.service';
import { ClientCoachModule } from '../clientCoach/clientCoach.module';
import { VideoLessonsModule } from '../videoLessons/videoLessons.module';

@Module({
  imports: [ConfigModule, ClientCoachModule, VideoLessonsModule],
  controllers: [VideoController],
  providers: [VideoChatService],
  exports: [VideoChatService],
})
export class VideoModule {}
