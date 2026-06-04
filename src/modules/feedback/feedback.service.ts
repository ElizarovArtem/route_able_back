import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from '../../entities/feedback.entity';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackStatus, FeedbackType } from '../../config/emuns/feedback';
import { FeedbackTelegramService } from './feedback-telegram.service';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, JwtUser } from '../../config/interfaces/jwt-payload';

type RequestWithCookies = Request & { cookies?: Record<string, string> };

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepo: Repository<Feedback>,
    private readonly feedbackTelegramService: FeedbackTelegramService,
    private readonly jwtService: JwtService,
  ) {}

  async create(
    dto: CreateFeedbackDto,
    req: RequestWithCookies,
    currentUser?: JwtUser,
  ): Promise<{ ok: true; id: string; status: FeedbackStatus }> {
    const user = await this.resolveUser(req, currentUser);

    const feedback = this.feedbackRepo.create({
      type: dto.type,
      message: dto.message,
      name: dto.name || null,
      contact: dto.contact || null,
      userId: user?.id || null,
      status: FeedbackStatus.PENDING,
      meta: this.buildMeta(req),
    });

    await this.feedbackRepo.save(feedback);

    // try {
    //   const { messageId } = await this.feedbackTelegramService.sendFeedback(
    //     feedback,
    //     { user },
    //   );
    //   feedback.status = FeedbackStatus.SENT;
    //   feedback.telegramMessageId = messageId ?? null;
    // } catch (err) {
    //   const error = err as Error;
    //   feedback.status = FeedbackStatus.FAILED;
    //   feedback.deliveryError = error?.message ?? 'Unknown Telegram error';
    //   this.logger.error(
    //     `Failed to deliver feedback ${feedback.id}`,
    //     error?.stack ?? String(err),
    //   );
    // }

    // await this.feedbackRepo.save(feedback);

    return {
      ok: true,
      id: feedback.id,
      status: feedback.status,
    };
  }

  async list(query: {
    type?: FeedbackType;
    status?: FeedbackStatus;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    const qb = this.feedbackRepo
      .createQueryBuilder('feedback')
      .leftJoinAndSelect('feedback.user', 'user')
      .orderBy('feedback.createdAt', 'DESC');

    if (query.type) {
      qb.andWhere('feedback.type = :type', { type: query.type });
    }
    if (query.status) {
      qb.andWhere('feedback.status = :status', { status: query.status });
    }
    if (query.search) {
      qb.andWhere(
        '(feedback.message ILIKE :search OR feedback.email ILIKE :search OR feedback.page ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const skip = query.skip ?? 0;
    const take = Math.min(query.take ?? 20, 100);
    qb.skip(skip).take(take);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      skip,
      take,
    };
  }

  private buildMeta(req: RequestWithCookies) {
    return {
      ip: req.ip ?? null,
      forwardedFor: this.normalizeHeaderValue(req.headers['x-forwarded-for']),
      userAgent: this.normalizeHeaderValue(req.headers['user-agent']),
      origin:
        this.normalizeHeaderValue(req.headers['origin']) ??
        this.normalizeHeaderValue(req.headers['x-origin']),
      referer:
        this.normalizeHeaderValue(req.headers['referer']) ??
        this.normalizeHeaderValue(req.headers['referrer']) ??
        this.normalizeHeaderValue(req.headers['x-referer']),
    };
  }

  private async resolveUser(
    req: RequestWithCookies,
    currentUser?: JwtUser,
  ): Promise<JwtUser | undefined> {
    if (currentUser?.id) {
      return currentUser;
    }

    const token = this.extractToken(req);
    if (!token) return undefined;

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      return {
        id: payload.sub,
        email: payload.email,
        roles: payload.roles ?? [],
        name: payload.name,
      };
    } catch (err) {
      this.logger.debug('Unable to parse JWT token for feedback user');
      return undefined;
    }
  }

  private extractToken(req: RequestWithCookies): string | undefined {
    const cookieToken = req.cookies?.ra_auth_token;
    if (cookieToken) return cookieToken;

    const header = req.headers['authorization'];
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7);
    }

    return undefined;
  }

  private normalizeHeaderValue(
    value: string | string[] | undefined,
  ): string | null {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return value ?? null;
  }
}
