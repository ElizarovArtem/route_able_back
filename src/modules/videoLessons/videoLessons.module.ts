import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoLesson } from '../../entities/video-lesson.entity';
import { ClientCoach } from '../../entities/client-coach.entity';
import { VideoLessonsService } from './videoLessons.service';
import { VideoLessonsController } from './videoLessons.controller';
import { ClientCoachModule } from '../clientCoach/clientCoach.module';

@Module({
  imports: [TypeOrmModule.forFeature([VideoLesson, ClientCoach]), ClientCoachModule],
  controllers: [VideoLessonsController],
  providers: [VideoLessonsService],
  exports: [VideoLessonsService],
})
export class VideoLessonsModule {}
