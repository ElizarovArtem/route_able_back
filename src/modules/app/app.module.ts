import { Module } from '@nestjs/common';
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
import { VideoLessonsModule } from '../videoLessons/videoLessons.module';
import { VideoModule } from '../video/video.module';
import { VideoLesson } from '../../entities/video-lesson.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
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
          VideoLesson,
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
    VideoLessonsModule,
    VideoModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
