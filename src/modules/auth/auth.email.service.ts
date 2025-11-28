import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class MailService {
  constructor(private readonly config: ConfigService) {}

  async sendMail(options: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    from?: string;
  }) {
    await axios.post(
      'https://api.sendsay.ru/general/api/v100/json/x_1764099620853452',
      {
        action: 'issue.send',
        letter: {
          message: {
            html: options.html,
          },
          subject: options.subject,
          'from.email': this.config.get('SENDSAY_FROM_EMAIL'),
        },
        group: 'personal',
        email: options.to,
        sendwhen: 'now',
      },
      {
        headers: {
          Authorization: `sendsay apikey=${this.config.get('SENDSAY_API_KEY')}`,
        },
      },
    );
  }
}
