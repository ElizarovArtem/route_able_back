import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeSlot } from '../../entities/time-slot.entity';
import { ClientCoach } from '../../entities/client-coach.entity';
import { User } from '../../entities/user.entity';
import { TimeSlotsService } from './timeSlots.service';
import { TimeSlotsController } from './timeSlots.controller';
import { CoachTimeSlotsController } from './coachTimeSlots.controller';
import { CoachWorkoutSessions } from '../../entities/coach-workout-sessions';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TimeSlot,
      ClientCoach,
      User,
      CoachWorkoutSessions,
    ]),
  ],
  providers: [TimeSlotsService],
  controllers: [TimeSlotsController, CoachTimeSlotsController],
  exports: [TimeSlotsService],
})
export class TimeSlotsModule {}
