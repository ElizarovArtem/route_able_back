import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoachWorkoutSessions } from '../../entities/coach-workout-sessions';
import { ClientCoach } from '../../entities/client-coach.entity';
import { ClientCoachTransaction } from '../../entities/client-coach-transaction.entity';
import { TimeSlot } from '../../entities/time-slot.entity';
import { CoachPayment } from '../../entities/coach-payments';
import { CoachWorkoutSessionsService } from './coachWorkoutSessions.service';
import { CoachWorkoutSessionsController } from './coachWorkoutSessions.controller';
import { ClientCoachModule } from '../clientCoach/clientCoach.module';
import { PaymentsModule } from '../payment/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CoachWorkoutSessions,
      ClientCoach,
      ClientCoachTransaction,
      TimeSlot,
      CoachPayment,
    ]),
    ClientCoachModule,
    PaymentsModule,
  ],
  controllers: [CoachWorkoutSessionsController],
  providers: [CoachWorkoutSessionsService],
  exports: [CoachWorkoutSessionsService],
})
export class CoachWorkoutSessionsModule {}
