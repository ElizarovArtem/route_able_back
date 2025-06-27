import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. Сначала пробуем вытащить из cookie
        (req: Request) => req?.cookies?.ra_auth_token,
        // 2. Затем — из Authorization: Bearer
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: 'jwt-secret-key',
    });
  }

  async validate(payload: any) {
    // payload — это расшифрованный токен (например, { sub: userId, email })
    return payload;
  }
}
