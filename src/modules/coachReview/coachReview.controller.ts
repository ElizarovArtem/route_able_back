import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UpsertCoachReviewDto } from './dto/upsert-coach-review.dto';
import { CoachReviewsService } from './coachReview.service';
import { JwtAuthGuard } from '../../libs/guards/auth.guard';

@Controller('reviews/:coachId')
@UseGuards(JwtAuthGuard)
export class CoachReviewsController {
  constructor(private readonly service: CoachReviewsService) {}

  @Post()
  async upsert(
    @Param('coachId') coachUserId: string,
    @Body() dto: UpsertCoachReviewDto,
    @Req() req: any,
  ) {
    const authorId = req.user.id;
    return this.service.upsertReview({ coachUserId, authorId, dto });
  }

  @Get()
  async list(
    @Param('coachId') coachId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.service.listCoachReviews(
      coachId,
      limit ? Number(limit) : 20,
      offset ? Number(offset) : 0,
    );
  }

  @Get('my')
  async myReview(@Param('coachId') coachId: string, @Req() req: any) {
    const authorId = req.user.id;
    return this.service.getMyReview(coachId, authorId);
  }
}
