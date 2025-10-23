import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../libs/guards/auth.guard';
import { VideoChatService } from './videoChat.service';

@Controller('video')
@UseGuards(JwtAuthGuard)
export class VideoController {
  constructor(private readonly video: VideoChatService) {}

  @Get('lesson-token')
  getLessonToken(@Req() req, @Query('relationId') relationId: string) {
    return this.video.getLessonJoinToken(req.user, relationId, {
      requireActive: true,
    });
  }
}
