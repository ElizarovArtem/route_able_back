import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

type TgGatewayOk<T> = { ok: true; result: T };
type TgGatewayErr = { ok: false; error: string };
type TgGatewayResp<T> = TgGatewayOk<T> | TgGatewayErr;

type RequestStatus = {
  request_id: string;
  phone_number: string;
  request_cost: number;
};

@Injectable()
export class TelegramGatewayService {
  private readonly baseUrl = 'https://gatewayapi.telegram.org';
  private readonly token: string;

  constructor(private readonly config: ConfigService) {
    this.token = this.config.get('TELEGRAM_API_KEY');
  }

  async sendVerificationMessage(params: {
    phoneNumber: string;
    code: string;
    ttlSeconds?: number;
  }): Promise<RequestStatus> {
    if (!this.token) {
      throw new InternalServerErrorException('TELEGRAM_API_KEY is not set');
    }

    const { phoneNumber, code } = params;

    try {
      const res = await axios.post<TgGatewayResp<RequestStatus>>(
        `${this.baseUrl}/sendVerificationMessage`,
        {
          phone_number: phoneNumber,
          code,
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10_000,
        },
      );

      if (res.data.ok) return res.data.result;

      throw new InternalServerErrorException(
        `Telegram Gateway error: ${(res.data as TgGatewayErr).error}`,
      );
    } catch (e: any) {
      throw new InternalServerErrorException(
        `Telegram Gateway request failed: ${e?.message ?? 'unknown error'}`,
      );
    }
  }
}
