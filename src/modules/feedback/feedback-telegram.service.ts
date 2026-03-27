import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Feedback } from '../../entities/feedback.entity';
import { JwtUser } from '../../config/interfaces/jwt-payload';

interface TelegramSendResult {
  messageId?: string;
}

@Injectable()
export class FeedbackTelegramService {
  private readonly logger = new Logger(FeedbackTelegramService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendFeedback(feedback: Feedback, opts: { user?: JwtUser } = {}) {
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    const chatId = this.configService.get<string>('TELEGRAM_FEEDBACK_CHAT_ID');
    if (!botToken || !chatId) {
      throw new Error('Telegram bot token or chat id is not configured');
    }

    const env =
      this.configService.get<string>('APP_ENV') ||
      this.configService.get<string>('NODE_ENV') ||
      'development';

    // const text = this.buildMessage(feedback, opts.user, env);
    // const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    // try {
    //   const response = await axios.post(url, {
    //     chat_id: chatId,
    //     text,
    //     disable_web_page_preview: true,
    //   });
    //   const messageId = response.data?.result?.message_id;
    //   return {
    //     messageId: messageId ? String(messageId) : undefined,
    //   };
    // } catch (err) {
    //   const error = err as Error;
    //   this.logger.error(
    //     'Failed to send feedback to Telegram',
    //     error?.stack ?? String(err),
    //   );
    //   throw new Error('Telegram API request failed');
    // }
  }

  // private buildMessage(
  //   feedback: Feedback,
  //   user: JwtUser | undefined,
  //   env: string,
  // ): string {
  //   const meta = feedback.meta ?? {};
  //   const format = (value?: string | null) =>
  //     typeof value === 'string' && value.trim().length > 0 ? value.trim() : '—';
  //   const roles =
  //     user?.roles?.length && user.roles.length > 0
  //       ? user.roles.join(', ')
  //       : '—';
  //   const createdAt = feedback.createdAt
  //     ? feedback.createdAt.toISOString()
  //     : new Date().toISOString();
  //   const ip =
  //     meta.ip || meta.forwardedFor || meta['x-forwarded-for'] || undefined;
  //
  //   return [
  //     '📝 Новый feedback',
  //     '',
  //     `ID: ${feedback.id}`,
  //     `Дата: ${createdAt}`,
  //     `Тип: ${feedback.type}`,
  //     `Окружение: ${env}`,
  //     `Страница: ${format(feedback.page)}`,
  //     `Origin: ${format(meta.origin)}`,
  //     `Referer: ${format(meta.referer)}`,
  //     `Пользователь: ${format(user?.id ?? feedback.userId)}`,
  //     `Роль: ${roles}`,
  //     `Email: ${format(feedback.email)}`,
  //     `Telegram: ${format(feedback.telegram)}`,
  //     `IP: ${format(ip)}`,
  //     '',
  //     'Сообщение:',
  //     feedback.message,
  //     '',
  //     'User-Agent:',
  //     format(meta.userAgent),
  //   ].join('\n');
  // }
}
