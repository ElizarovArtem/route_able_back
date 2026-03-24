import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CoachVerificationService } from './coachVerification.service';
import { CoachVerificationController } from './coachVerification.controller';

import { User } from '../../entities/user.entity';
import { AdminCoachVerificationController } from './coachVerification.admin.controller';
import { CoachVerificationRequest } from '../../entities/coach-verification.entity';
import { CoachProfile } from '../../entities/coach-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CoachVerificationRequest, User, CoachProfile]),
  ],
  controllers: [CoachVerificationController, AdminCoachVerificationController],
  providers: [CoachVerificationService],
  exports: [CoachVerificationService],
})
export class CoachVerificationModule {}
