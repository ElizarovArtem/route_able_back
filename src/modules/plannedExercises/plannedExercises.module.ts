import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlannedExercise } from '../../entities/planned-exercise.entity';
import { ClientCoach } from '../../entities/client-coach.entity';
import { PlannedExercisesController } from './plannedExercises.controller';
import { PlannedExercisesService } from './plannedExercises.servise';
import { ExerciseLog } from '../../entities/exercise-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlannedExercise, ClientCoach, ExerciseLog]),
  ],
  controllers: [PlannedExercisesController],
  providers: [PlannedExercisesService],
  exports: [PlannedExercisesService],
})
export class PlannedExercisesModule {}
