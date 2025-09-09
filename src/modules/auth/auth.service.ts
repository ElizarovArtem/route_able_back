import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthCodes } from '../../entities/auth.entity';
import { JwtService } from '@nestjs/jwt';
import { SmsService } from './auth.sms.service';
import { UserService } from '../user/user.service';
import { Roles } from '../../config/emuns/user';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AuthCodes)
    private authCodeRepo: Repository<AuthCodes>,
    private jwtService: JwtService,
    private smsService: SmsService,
    private userService: UserService,
  ) {}

  async requestCode(phone: string) {
    const smsCode = Math.floor(100000 + Math.random() * 900000).toString();

    const authCodeInstance = {
      phone,
      smsCode,
    };

    await this.authCodeRepo.save(authCodeInstance);

    await this.smsService.sendSms(phone, `Ваш код: ${smsCode}`);
    return { success: true };
  }

  async login(phone: string, code: string) {
    const authCode = await this.authCodeRepo.findOne({
      where: { phone: phone },
    });

    if (!authCode || authCode.smsCode !== code) {
      throw new UnauthorizedException('Неверный код');
    }

    await this.authCodeRepo.delete({ phone });

    let user = await this.userService.findOne(phone);

    if (!user) {
      user = await this.userService.create({ phone, roles: [Roles.Client] });
    }

    const payload = {
      id: user.id,
      phone: user.phone,
      roles: user.roles,
      name: user.name,
    };

    const token = this.jwtService.sign(payload, { expiresIn: '15m' });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    return { token, refreshToken, user };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);

      const newPayload = {
        id: payload.id,
        phone: payload.phone,
        roles: payload.roles,
        name: payload.name,
      };

      const newAccessToken = this.jwtService.sign(newPayload, {
        expiresIn: '15m',
      });

      return { newAccessToken };
    } catch {
      throw new UnauthorizedException();
    }
  }

  async checkAuth(token: string) {
    try {
      const payload = this.jwtService.verify(token);

      const user = await this.userService.findOne(payload.phone);

      return { user };
    } catch {
      throw new UnauthorizedException();
    }
  }
}
