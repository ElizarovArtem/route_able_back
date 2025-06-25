import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  async sendSms(phone: string, message: string) {
    Logger.log(`📲 SMS to ${phone}: ${message}`);
    // Тут можно подключить real API — например, Twilio, SMS.ru, iFreeSMS и т.п.
  }
}
