import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../libs/guards/auth.guard';
import { VideoLessonsService } from './videoLessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';

@Controller('client-coach/:relationId/video-lessons')
@UseGuards(JwtAuthGuard)
export class VideoLessonsController {
  constructor(private readonly svc: VideoLessonsService) {}

  @Post()
  create(
    @Req() req,
    @Param('relationId') relationId: string,
    @Body() dto: CreateLessonDto,
  ) {
    return this.svc.create(req.user.id, relationId, dto);
  }

  @Get()
  list(@Req() req, @Param('relationId') relationId: string) {
    return this.svc.list(req.user.id, relationId);
  }

  @Delete(':lessonId')
  cancel(@Req() req, @Param('lessonId') lessonId: string) {
    return this.svc.cancel(req.user.id, lessonId);
  }

  @Post(':lessonId/touch-progress')
  touchProgress(
    @Req() req,
    @Param('relationId') relationId: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.svc.touchProgress(req.user.id, relationId, lessonId);
  }
}
