import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feedback } from '../../entities/feedback.entity';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { FeedbackTelegramService } from './feedback-telegram.service';

@Module({
  imports: [TypeOrmModule.forFeature([Feedback])],
  controllers: [FeedbackController],
  providers: [FeedbackService, FeedbackTelegramService],
})
export class FeedbackModule {}
