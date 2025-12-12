import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../libs/guards/auth.guard';
import { VideoLessonsService } from './videoLessons.service';
import { CurrentUser } from '../../config/decorators/current-user.decorator';
import { CoachLessonsQueryDto } from './dto/coach-lessons-query.dto';
import { RolesGuard } from '../../libs/guards/roles.guard';
import { RolesDecorator } from '../../config/decorators/roles.decorator';
import { Roles } from '../../config/emuns/user';

@Controller('coach/video-lessons')
@UseGuards(JwtAuthGuard, RolesGuard)
@RolesDecorator(Roles.Coach)
export class CoachVideoLessonsController {
  constructor(private readonly svc: VideoLessonsService) {}

  @Get()
  async listForCoach(
    @CurrentUser('id') coachId: string,
    @Query() query: CoachLessonsQueryDto,
  ) {
    return this.svc.listForCoachByDay(coachId, query.date);
  }
}
