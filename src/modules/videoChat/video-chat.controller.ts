// src/modules/video/video.controller.ts
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../libs/guards/auth.guard';
import { VideoChatService } from './video-chat.service';

@Controller('video')
@UseGuards(JwtAuthGuard)
export class VideoChatController {
  constructor(private readonly video: VideoChatService) {}

  // /video/token?relationId=...  (по умолчанию пускаем и неактивные — поменяй requireActive на true, если надо)
  @Get('token')
  getToken(@Req() req, @Query('relationId') relationId: string) {
    return this.video.getJoinToken(req.user, relationId, {
      requireActive: false,
    });
  }
}
