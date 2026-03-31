import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CoachWorkoutSessionsService } from './coachWorkoutSessions.service';
import { JwtAuthGuard } from '../../libs/guards/auth.guard';
import { CurrentUser } from '../../config/decorators/current-user.decorator';
import { CancelCoachWorkoutSessionDto } from './dto/cancel-coach-workout-session.dto';
import { RolesGuard } from '../../libs/guards/roles.guard';
import { RolesDecorator } from '../../config/decorators/roles.decorator';
import { Roles } from '../../config/emuns/user';
import { DayQueryDto } from '../timeSlots/dto/day-query.dto';
import { ListClientUpcomingSessionsQueryDto } from './dto/list-client-upcoming.query';

@Controller('coach-workout-sessions')
@UseGuards(JwtAuthGuard)
export class CoachWorkoutSessionsController {
  constructor(private readonly sessions: CoachWorkoutSessionsService) {}

  @Get('relation/:relationId')
  listForRelation(
    @CurrentUser('id') userId: string,
    @Param('relationId') relationId: string,
  ) {
    return this.sessions.listForRelation(userId, relationId);
  }

  @Get('coach/day')
  @UseGuards(RolesGuard)
  @RolesDecorator(Roles.Coach)
  listForCoachByDay(
    @CurrentUser('id') coachId: string,
    @Query() query: DayQueryDto,
  ) {
    return this.sessions.listForCoachByDay(coachId, query.date);
  }

  @Get('client/upcoming')
  @UseGuards(RolesGuard)
  @RolesDecorator(Roles.Client)
  listUpcomingForClient(
    @CurrentUser('id') clientId: string,
    @Query() query: ListClientUpcomingSessionsQueryDto,
  ) {
    return this.sessions.listUpcomingForClient(clientId, query);
  }

  @Post(':sessionId/cancel')
  cancelSession(
    @CurrentUser('id') userId: string,
    @Param('sessionId') sessionId: string,
    @Body() dto: CancelCoachWorkoutSessionDto,
  ) {
    return this.sessions.cancelSession(userId, sessionId, dto);
  }

  @Post(':sessionId/complete')
  @UseGuards(RolesGuard)
  @RolesDecorator(Roles.Coach)
  markCompleted(
    @CurrentUser('id') coachId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.sessions.markCompletedByCoach(coachId, sessionId);
  }

  @Post(':sessionId/confirm')
  @UseGuards(RolesGuard)
  @RolesDecorator(Roles.Client)
  confirmByClient(
    @CurrentUser('id') clientId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.sessions.confirmByClient(clientId, sessionId);
  }

  @Get('relation/:relationId/can-join')
  canJoin(
    @CurrentUser('id') userId: string,
    @Param('relationId') relationId: string,
  ) {
    return this.sessions.canJoin(userId, relationId);
  }
}
