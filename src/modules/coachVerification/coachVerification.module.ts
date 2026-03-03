import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CoachVerificationService } from './coachVerification.service';
import { CoachVerificationController } from './coachVerification.controller';

import { User } from '../../entities/user.entity';
import { AdminCoachVerificationController } from './coachVerification.admin.controller';
import { CoachVerificationRequest } from '../../entities/coach-verification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CoachVerificationRequest, User])],
  controllers: [CoachVerificationController, AdminCoachVerificationController],
  providers: [CoachVerificationService],
  exports: [CoachVerificationService],
})
export class CoachVerificationModule {}
