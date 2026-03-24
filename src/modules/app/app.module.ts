import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from '../user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { AuthCodes } from '../../entities/auth.entity';
import { Day } from '../../entities/day.entity';
import { Meal } from '../../entities/meal.entity';
import { MealModule } from '../meal/meal.module';
import { DayModule } from '../day/day.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatModule } from '../chat/chat.module';
import { Chat } from '../../entities/chat.entity';
import { ChatParticipant } from '../../entities/chat-participant.entity';
import { Message } from '../../entities/message.entity';
import { ClientCoach } from '../../entities/client-coach.entity';
import { ClientCoachModule } from '../clientCoach/clientCoach.module';
import { PlannedMealsModule } from '../plannedMeals/plannedMeals.module';
import { PlannedMeal } from '../../entities/planned-meal.entity';
import { PlannedExercisesModule } from '../plannedExercises/plannedExercises.module';
import { PlannedExercise } from '../../entities/planned-exercise.entity';
import { ExerciseLog } from '../../entities/exercise-log.entity';
import { VideoModule } from '../video/video.module';
import { TimeSlotsModule } from '../timeSlots/timeSlots.module';
import { TimeSlot } from '../../entities/time-slot.entity';
import { WorkoutSession } from '../../entities/workout-session.entity';
import { WorkoutExercise } from '../../entities/workout-exercise.entity';
import { CoachVerificationRequest } from '../../entities/coach-verification.entity';
import { CoachVerificationModule } from '../coachVerification/coachVerification.module';
import { CoachReviewsModule } from '../coachReview/coachReview.module';
import { CoachReview } from '../../entities/coach-review.entity';
import { CoachProfile } from '../../entities/coach-profile.entity';
import { Purchase } from '../../entities/purchase.entity';
import { CoachBillingModule } from '../coachBilling/coachBilling.module';
import { PaymentsModule } from '../payment/payments.module';
import { ClientCoachTransaction } from '../../entities/client-coach-transaction.entity';
import { CoachOffer } from '../../entities/coach-offer.entity';
import { CoachOrder } from '../../entities/coach-order.entity';
import { CoachWorkoutSessionsModule } from '../coachWorkoutSessions/coachWorkoutSessions.module';
import { CoachWorkoutSessions } from '../../entities/coach-workout-sessions';
import { CoachPayment } from '../../entities/coach-payments';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [
          User,
          AuthCodes,
          Day,
          Meal,
          Chat,
          ChatParticipant,
          Message,
          ClientCoach,
          PlannedMeal,
          PlannedExercise,
          ExerciseLog,
          CoachPayment,
          CoachWorkoutSessions,
          TimeSlot,
          WorkoutSession,
          WorkoutExercise,
          CoachVerificationRequest,
          CoachReview,
          CoachProfile,
          Purchase,
          ClientCoachTransaction,
          CoachOffer,
          CoachOrder,
        ],
        synchronize: true, // Только для разработки
      }),
    }),

    UserModule,
    AuthModule,
    MealModule,
    DayModule,
    ChatModule,
    ClientCoachModule,
    PlannedMealsModule,
    PlannedExercisesModule,
    VideoModule,
    TimeSlotsModule,
    CoachWorkoutSessionsModule,
    CoachVerificationModule,
    CoachReviewsModule,
    CoachBillingModule,
    PaymentsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
