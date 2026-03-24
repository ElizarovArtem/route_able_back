import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VideoController } from './video.controller';
import { VideoChatService } from './videoChat.service';
import { ClientCoachModule } from '../clientCoach/clientCoach.module';
import { CoachWorkoutSessionsModule } from '../coachWorkoutSessions/coachWorkoutSessions.module';

@Module({
  imports: [ConfigModule, ClientCoachModule, CoachWorkoutSessionsModule],
  controllers: [VideoController],
  providers: [VideoChatService],
  exports: [VideoChatService],
})
export class VideoModule {}
