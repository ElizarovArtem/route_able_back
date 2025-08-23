import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import GigaChat from 'gigachat';
import * as https from 'node:https';
import { AnalyzeMealPhotoDto } from './dto/analyze-meal-photo.dto';
import axios from 'axios';
import { randomUUID } from 'crypto';
import * as FormData from 'form-data';

@Injectable()
export class AiService {
  private readonly giga: any;
  private readonly photoGiga: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GIGA_CHAT_API_KEY');
    this.giga = new GigaChat({
      credentials: apiKey,
      scope: 'GIGACHAT_API_PERS',
      model: 'GigaChat',
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });

    this.photoGiga = new GigaChat({
      credentials: apiKey,
      scope: 'GIGACHAT_API_PERS',
      model: 'GigaChat-Pro',
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });
  }

  private async getSberAccessToken(): Promise<string> {
    const tokenResponse = await axios.post(
      'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
      { scope: 'GIGACHAT_API_PERS' },
      {
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          Authorization: `Basic ${this.configService.get<string>(
            'GIGA_CHAT_API_KEY',
          )}`,
          RqUID: randomUUID(),
        },
      },
    );

    return tokenResponse.data.access_token;
  }

  private async uploadPhotoToSber(
    token: string,
    photo: Express.Multer.File,
  ): Promise<string> {
    const formData = new FormData();

    formData.append('file', photo.buffer, {
      filename: photo.originalname,
      contentType: photo.mimetype,
    });
    formData.append('purpose', 'general');

    const uploadedPhoto = await axios.post(
      'https://developers.sber.ru/docs/api/gigachat/v1/files',
      formData,
      {
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
        headers: {
          'Content-Type': 'multipart/form-data',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return uploadedPhoto.data.id;
  }

  async analyzeTextMeal(text: string) {
    const prompt = `
      Ты — нутрициолог. На основе описания еды оцени примерное количество калорий, белков, жиров и углеводов.
      Верни ТОЛЬКО JSON следующего вида:
      
      {
        "name": string,
        "calories": number,
        "protein": number,
        "fat": number,
        "carbs": number
      }
      
      Никакого дополнительного текста. Только JSON.
      Описание: ${text}
      `;

    try {
      const response = await this.giga.chat({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      const content = response.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*?\}/);
      const json = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      if (!json) throw new Error('Невозможно разобрать JSON');

      return json;
    } catch (error) {
      console.error('GigaChat error:', error?.response?.data || error.message);
      throw new InternalServerErrorException(
        'GigaChat не смог обработать запрос',
      );
    }
  }

  async analyzePhotoMeal(
    { weight }: AnalyzeMealPhotoDto,
    photo: Express.Multer.File,
  ) {
    try {
      const token = await this.getSberAccessToken();

      const photoId = await this.uploadPhotoToSber(token, photo);

      const prompt = `
      Ты — нутрициолог. На основе изображения блюда и данных ниже оцени БЖУ и калории.
      Учитывай вес (в граммах), масштабируй значения пропорционально.
      
      Данные:
      - Вес (граммы): ${weight}
      
      Верни ТОЛЬКО JSON без лишнего текста:
      {
        "name": string,      // название блюда/продукта
        "calories": number,  // ккал на весь объём
        "protein": number,   // граммы белка
        "fat": number,       // граммы жира
        "carbs": number      // граммы углеводов
      }
      `.trim();

      const response = await this.photoGiga.chat({
        messages: [
          {
            role: 'user',
            content: prompt,
            attachments: [photoId],
          },
        ],
        temperature: 0.2,
        max_tokens: 300,
      });

      const content = response.choices?.[0]?.message?.content ?? '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('JSON not found in model response');

      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException(`GigaChat Vision error: ${e}`);
    }
  }
}
