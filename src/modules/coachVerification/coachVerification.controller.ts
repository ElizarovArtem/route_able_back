import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../libs/guards/auth.guard';
import { CoachVerificationService } from './coachVerification.service';
import { CreateCoachVerificationRequestDto } from './dto/create-verification-request';

@Controller('coach-verification')
@UseGuards(JwtAuthGuard)
export class CoachVerificationController {
  constructor(private readonly svc: CoachVerificationService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateCoachVerificationRequestDto) {
    return this.svc.create(req.user.id, dto.name, dto.contactInfo);
  }

  @Get('me')
  my(@Req() req) {
    return this.svc.myLatest(req.user.id);
  }
}
