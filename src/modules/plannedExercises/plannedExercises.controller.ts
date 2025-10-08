import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../libs/guards/auth.guard';
import { CreatePlannedExerciseDto } from './dto/create-planned-exercise.dto';
import { ListByDateQuery } from './dto/list-by-date.query';
import { PlannedExercisesService } from './plannedExercises.servise';

@Controller('client-coach/:relationId/workouts')
@UseGuards(JwtAuthGuard)
export class PlannedExercisesController {
  constructor(
    private readonly plannedExercisesService: PlannedExercisesService,
  ) {}

  @Post()
  add(
    @Req() req,
    @Param('relationId') relationId: string,
    @Body() dto: CreatePlannedExerciseDto,
  ) {
    return this.plannedExercisesService.addExercise(
      req.user.id,
      relationId,
      dto,
    );
  }

  // список плана за дату
  @Get()
  list(
    @Req() req,
    @Param('relationId') relationId: string,
    @Query() q: ListByDateQuery,
  ) {
    const limit = q.limit ? Number(q.limit) : 200;
    return this.plannedExercisesService.listForDate(
      req.user.id,
      relationId,
      q.date,
      limit,
    );
  }

  // отметить «выполнено» (клиент), без тела
  @Post(':exerciseId/complete')
  complete(
    @Req() req,
    @Param('relationId') relationId: string,
    @Param('exerciseId') exerciseId: string,
  ) {
    return this.plannedExercisesService.completeExercise(
      req.user.id,
      relationId,
      exerciseId,
    );
  }

  // удалить упражнение (тренер)
  @Delete(':exerciseId')
  remove(
    @Req() req,
    @Param('relationId') relationId: string,
    @Param('exerciseId') exerciseId: string,
  ) {
    return this.plannedExercisesService.deletePlannedExercise(
      req.user.id,
      relationId,
      exerciseId,
    );
  }
}
