import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeSlot } from '../../entities/time-slot.entity';
import { ClientCoach } from '../../entities/client-coach.entity';
import { VideoLesson } from '../../entities/video-lesson.entity';
import { User } from '../../entities/user.entity';
import { TimeSlotsService } from './timeSlots.service';
import { TimeSlotsController } from './timeSlots.controller';
import { CoachTimeSlotsController } from './coachTimeSlots.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([TimeSlot, ClientCoach, VideoLesson, User]),
  ],
  providers: [TimeSlotsService],
  controllers: [TimeSlotsController, CoachTimeSlotsController],
  exports: [TimeSlotsService],
})
export class TimeSlotsModule {}
