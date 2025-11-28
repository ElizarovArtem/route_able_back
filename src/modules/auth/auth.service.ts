import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthChannel, AuthCodes } from '../../entities/auth.entity';
import { JwtService } from '@nestjs/jwt';
import { SmsService } from './auth.sms.service';
import { UserService } from '../user/user.service';
import { Roles } from '../../config/emuns/user';
import { MailService } from './auth.email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AuthCodes)
    private authCodeRepo: Repository<AuthCodes>,
    private jwtService: JwtService,
    private smsService: SmsService,
    private emailService: MailService,
    private userService: UserService,
  ) {}

  async requestCode(phone: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await this.authCodeRepo.save({
      phone,
      code,
      channel: AuthChannel.SMS,
    });

    await this.smsService.sendSms(phone, `Ваш код: ${code}`);
    return { success: true };
  }

  async requestEmailCode(email: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await this.authCodeRepo.save({
      email,
      code,
      channel: AuthChannel.EMAIL,
    });

    await this.emailService.sendMail({
      to: email,
      subject: 'Ваш проверочный код',
      text: `Проверочный код: ${code}`,
      html: `<p>Проверочный код: ${code}</p>`,
    });
    return { success: true };
  }

  async login(phone: string, code: string) {
    const authCode = await this.authCodeRepo.findOne({
      where: { phone: phone },
    });

    if (!authCode || authCode.code !== code) {
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

  async loginByEmail(email: string, code: string) {
    const authCode = await this.authCodeRepo.findOne({
      where: { email, channel: AuthChannel.EMAIL },
      order: { createdAt: 'DESC' },
    });

    if (!authCode || authCode.code !== code) {
      throw new UnauthorizedException('Неверный код');
    }

    await this.authCodeRepo.delete({ email });

    // тут уже нужно, чтобы User умел работать с email
    let user = await this.userService.findOneByEmail(email);

    if (!user) {
      user = await this.userService.create({ email, roles: [Roles.Client] });
    }

    const payload = {
      id: user.id,
      email: user.email,
      roles: user.roles,
      name: user.name,
    };

    const token = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return { token, refreshToken, user };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);

      const newPayload = {
        id: payload.id,
        phone: payload.phone,
        email: payload.email,
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

      const user = await this.userService.findOneByPhoneOrEmail(
        payload.email || payload.phone,
      );

      return { user };
    } catch {
      throw new UnauthorizedException();
    }
  }
}
