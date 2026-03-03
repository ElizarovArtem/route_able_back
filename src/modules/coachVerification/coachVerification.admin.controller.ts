import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../libs/guards/auth.guard';
import { CoachVerificationStatus } from '../../config/emuns/coach-verification';
import { CoachVerificationService } from './coachVerification.service';
import { ReviewCoachVerificationDto } from './dto/review-coach-request';
import { RolesGuard } from '../../libs/guards/roles.guard';
import { RolesDecorator } from '../../config/decorators/roles.decorator';
import { Roles } from '../../config/emuns/user';

@Controller('admin/coach-verification-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@RolesDecorator(Roles.Admin)
export class AdminCoachVerificationController {
  constructor(private readonly svc: CoachVerificationService) {}

  @Get()
  list(@Query('status') status?: CoachVerificationStatus) {
    return this.svc.list(status);
  }

  @Post(':id/review')
  review(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: ReviewCoachVerificationDto,
  ) {
    return this.svc.review(req.user.id, id, dto.decision);
  }
}
