import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../libs/guards/auth.guard';
import { WorkoutService } from './ai.workout.service';
import { CreateWorkoutPlanDto } from './dto/create-workout-plan.dto';
import { CurrentUser } from '../../config/decorators/current-user.decorator';
import { WorkoutHistoryItemDto } from './dto/workout-history.dto';
import { WorkoutTemplateListItemDto } from './dto/workout-templates.dto';

@Controller('ai/workouts')
@UseGuards(JwtAuthGuard)
export class WorkoutController {
  constructor(private readonly workoutService: WorkoutService) {}

  @Get()
  async listTemplates(
    @CurrentUser() user: { id: string },
  ): Promise<WorkoutTemplateListItemDto[]> {
    return this.workoutService.listMyWorkoutTemplates(user.id);
  }

  @Post('plan')
  createPlan(@Req() req, @Body() dto: CreateWorkoutPlanDto) {
    return this.workoutService.createPlanForToday(req.user.id, dto);
  }

  @Get('history')
  async listHistory(
    @CurrentUser() user: { id: string },
  ): Promise<WorkoutHistoryItemDto[]> {
    return this.workoutService.listMyWorkoutHistory(user.id);
  }

  @Get('templates/:templateId/last')
  getLastByTemplate(
    @CurrentUser() user: { id: string },
    @Param('templateId') templateId: string,
  ) {
    return this.workoutService.getLastSessionByTemplate(user.id, templateId);
  }

  @Get(':sessionId/continue')
  continueSession(
    @CurrentUser() user: { id: string },
    @Param('sessionId') sessionId: string,
  ) {
    return this.workoutService.continueSession(user.id, sessionId);
  }

  @Patch(':sessionId/start')
  startSession(@Req() req, @Param('sessionId') sessionId: string) {
    return this.workoutService.startSession(req.user.id, sessionId);
  }

  @Patch(':sessionId/exercises/:exerciseId/complete-set')
  completeSet(
    @Req() req,
    @Param('sessionId') sessionId: string,
    @Param('exerciseId') exerciseId: string,
  ) {
    return this.workoutService.completeSet(req.user.id, sessionId, exerciseId);
  }

  @Patch(':sessionId/exercises/:exerciseId/set-current')
  setCurrentExercise(
    @Req() req,
    @Param('sessionId') sessionId: string,
    @Param('exerciseId') exerciseId: string,
  ) {
    return this.workoutService.setCurrentExercise(
      req.user.id,
      sessionId,
      exerciseId,
    );
  }

  @Delete('templates/:templateId')
  deleteTemplate(
    @CurrentUser() user: { id: string },
    @Param('templateId') templateId: string,
  ) {
    return this.workoutService.deleteTemplate(user.id, templateId);
  }

  @Delete(':sessionId')
  deleteSession(
    @CurrentUser() user: { id: string },
    @Param('sessionId') sessionId: string,
  ) {
    return this.workoutService.deleteSession(user.id, sessionId);
  }

  @Post(':sessionId/repeat')
  repeatSession(@Req() req, @Param('sessionId') sessionId: string) {
    return this.workoutService.repeatSession(req.user.id, sessionId);
  }
}
