import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GigaChatService } from './gigachat.service';
import { WorkoutController } from './ai.workout.controller';
import { WorkoutService } from './ai.workout.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutSession } from '../../entities/workout-session.entity';
import { WorkoutExercise } from '../../entities/workout-exercise.entity';
import { User } from '../../entities/user.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([WorkoutSession, WorkoutExercise, User]),
  ],
  providers: [GigaChatService, WorkoutService],
  controllers: [WorkoutController],
  exports: [GigaChatService],
})
export class AiModule {}
