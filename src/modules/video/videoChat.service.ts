import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken } from 'livekit-server-sdk';
import { ClientCoachService } from '../clientCoach/clientCoach.service';
import { VideoLessonsService } from '../videoLessons/videoLessons.service';

type GetTokenOpts = { requireActive?: boolean };

@Injectable()
export class VideoChatService {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly wsUrl: string;

  constructor(
    private readonly config: ConfigService,
    private readonly clientCoach: ClientCoachService,
    private readonly lessons: VideoLessonsService,
  ) {
    this.apiKey = this.config.get<string>('LIVEKIT_API_KEY', '');
    this.apiSecret = this.config.get<string>('LIVEKIT_API_SECRET', '');
    this.wsUrl = this.config.get<string>('LIVEKIT_WS_URL', '');
    if (!this.apiKey || !this.apiSecret || !this.wsUrl) {
      throw new Error(
        'LiveKit config is missing: LK_API_KEY / LK_API_SECRET / LK_WS_URL',
      );
    }
  }

  async getLessonJoinToken(
    user: { id: string; name?: string | null },
    relationId: string,
    opts: GetTokenOpts = {},
  ) {
    if (!relationId) throw new BadRequestException('relationId is required');

    const link = opts.requireActive
      ? await this.clientCoach.requireActiveByRelationId(user.id, relationId)
      : await this.clientCoach.requireMembershipByRelationId(
          user.id,
          relationId,
        );

    const { lesson } = await this.lessons.canJoin(user.id, relationId);
    if (!lesson) {
      throw new ForbiddenException(
        'Доступ к видеочату разрешён только в окно урока',
      );
    }

    const roomName = lesson.id;
    const meRole = user.id === link.coachId ? 'coach' : 'client';

    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity: user.id,
      name: user.name ?? meRole,
    });
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    return {
      token: await at.toJwt(),
      url: this.wsUrl,
      room: roomName,
      meRole,
      lessonId: lesson.id,
    };
  }

  async getAdhocRoomToken(
    user: { id: string; name?: string | null },
    roomId: string,
  ) {
    const room = roomId?.trim();
    if (!room) throw new BadRequestException('roomId is required');

    const displayName = user.name ?? 'participant';
    const meRole = 'participant';

    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity: user.id,
      name: displayName,
    });
    at.addGrant({
      roomJoin: true,
      room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    return {
      token: await at.toJwt(),
      url: this.wsUrl,
      room,
      meRole,
    };
  }
}
