import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoachReview } from '../../entities/coach-review.entity';
import { CoachProfile } from '../../entities/coach-profile.entity';
import { Purchase } from '../../entities/purchase.entity';
import { CoachReviewsController } from './coachReview.controller';
import { CoachReviewsService } from './coachReview.service';
import { User } from '../../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CoachReview, CoachProfile, Purchase, User]),
  ],
  controllers: [CoachReviewsController],
  providers: [CoachReviewsService],
  exports: [CoachReviewsService],
})
export class CoachReviewsModule {}
