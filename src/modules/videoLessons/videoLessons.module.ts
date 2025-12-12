import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoLesson } from '../../entities/video-lesson.entity';
import { ClientCoach } from '../../entities/client-coach.entity';
import { VideoLessonsService } from './videoLessons.service';
import { VideoLessonsController } from './videoLessons.controller';
import { ClientCoachModule } from '../clientCoach/clientCoach.module';
import { CoachVideoLessonsController } from './coachVideoLessons.controller';
import { TimeSlot } from '../../entities/time-slot.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([VideoLesson, ClientCoach, TimeSlot]),
    ClientCoachModule,
  ],
  controllers: [VideoLessonsController, CoachVideoLessonsController],
  providers: [VideoLessonsService],
  exports: [VideoLessonsService],
})
export class VideoLessonsModule {}
