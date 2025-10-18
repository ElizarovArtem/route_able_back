import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken } from 'livekit-server-sdk';
import { ClientCoachService } from '../clientCoach/clientCoach.service';

type GetTokenOpts = {
  requireActive?: boolean; // если true — пускаем только по активной связи
};

@Injectable()
export class VideoChatService {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly wsUrl: string;

  constructor(
    private readonly config: ConfigService,
    private readonly clientCoach: ClientCoachService,
  ) {
    this.apiKey = this.config.get<string>('LK_API_KEY', '');
    this.apiSecret = this.config.get<string>('LK_API_SECRET', '');
    this.wsUrl = this.config.get<string>('LK_WS_URL', '');
    if (!this.apiKey || !this.apiSecret || !this.wsUrl) {
      // Лучше fail-fast, чтобы не ловить загадочные ошибки позже
      // Можно заменить на Logger.warn, если хочешь мягче
      throw new Error(
        'LiveKit config is missing: LK_API_KEY / LK_API_SECRET / LK_WS_URL',
      );
    }
  }

  /**
   * Выдаёт токен для комнаты = relationId. Проверяет, что пользователь — участник связи.
   * Если requireActive=true, дополнительно проверяет активность.
   */
  async getJoinToken(
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

    const meRole = user.id === link.coachId ? 'coach' : 'client';

    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity: user.id, // уникально в комнате
      name: user.name ?? meRole, // красивое имя
      // ttl: 60 * 15,                  // можно задать срок жизни (сек)
    });

    at.addGrant({
      room: relationId, // имя комнаты = relationId
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();
    return { token, url: this.wsUrl, room: relationId, meRole };
  }
}
