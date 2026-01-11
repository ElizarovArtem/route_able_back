import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import GigaChat from 'gigachat';
import * as https from 'node:https';
import axios from 'axios';
import { randomUUID } from 'crypto';
import * as FormData from 'form-data';
import * as sharp from 'sharp';

@Injectable()
export class GigaChatService {
  private readonly giga: any;
  private readonly photoGiga: any;
  private readonly httpsAgent: https.Agent;
  private readonly apiKey: string;
  private readonly scope = 'GIGACHAT_API_PERS';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GIGA_CHAT_API_KEY');
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    this.giga = new GigaChat({
      credentials: this.apiKey,
      scope: this.scope,
      model: 'GigaChat',
      httpsAgent: this.httpsAgent,
    });

    this.photoGiga = new GigaChat({
      credentials: this.apiKey,
      scope: this.scope,
      model: 'GigaChat-Pro',
      httpsAgent: this.httpsAgent,
    });
  }

  private async compressImage(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .rotate()
      .resize({
        width: 800,
        height: 800,
        fit: 'inside', // не растягивать, только ужимать
      })
      .jpeg({
        quality: 75,
        chromaSubsampling: '4:2:0',
      })
      .toBuffer();
  }

  private async getAccessToken(): Promise<string> {
    try {
      const tokenResponse = await axios.post(
        'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
        { scope: this.scope },
        {
          httpsAgent: this.httpsAgent,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            Authorization: `Basic ${this.apiKey}`,
            RqUID: randomUUID(),
          },
        },
      );

      return tokenResponse.data.access_token;
    } catch (e) {
      throw new InternalServerErrorException(
        'GigaChat OAuth error: ' + (e?.message ?? e),
      );
    }
  }

  private async uploadFileToSber(
    token: string,
    buffer: Buffer,
    filename: string,
    mimetype: string,
  ): Promise<string> {
    const formData = new FormData();
    formData.append('file', buffer, {
      filename,
      contentType: mimetype,
    });
    formData.append('purpose', 'general');

    const res = await axios.post(
      'https://gigachat.devices.sberbank.ru/api/v1/files',
      formData,
      {
        httpsAgent: this.httpsAgent,
        headers: {
          ...formData.getHeaders(),
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return res.data.id;
  }

  async chat(opts: {
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
    temperature?: number;
    maxTokens?: number;
  }): Promise<string> {
    try {
      const response = await this.giga.chat({
        messages: opts.messages,
        temperature: opts.temperature || 0.3,
      });

      return response.choices?.[0]?.message?.content ?? '';
    } catch (e) {
      throw new InternalServerErrorException(
        'GigaChat text error: ' + (e?.message ?? e),
      );
    }
  }

  async chatWithImage(opts: {
    prompt: string;
    file: Express.Multer.File;
    temperature?: number;
    maxTokens?: number;
  }): Promise<string> {
    const { file, prompt } = opts;

    if (!file) {
      throw new BadRequestException('Файл не передан');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Нужен файл изображения');
    }

    try {
      const token = await this.getAccessToken();
      const compressed = await this.compressImage(file.buffer);

      const photoId = await this.uploadFileToSber(
        token,
        compressed,
        file.originalname,
        file.mimetype,
      );

      const response = await this.photoGiga.chat({
        messages: [
          {
            role: 'user',
            content: prompt,
            attachments: [photoId],
          },
        ],
        temperature: opts.temperature || 0.2,
        max_tokens: opts.maxTokens || 300,
      });

      return response.choices?.[0]?.message?.content ?? '';
    } catch (e) {
      throw new InternalServerErrorException(
        'GigaChat vision error: ' + (e?.message ?? e),
      );
    }
  }
}
