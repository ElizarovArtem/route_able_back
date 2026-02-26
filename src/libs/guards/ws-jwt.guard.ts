import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import * as cookie from 'cookie';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<Socket>();

    const rawCookie = client.handshake.headers.cookie;
    if (!rawCookie) return false;

    const parsed = cookie.parse(rawCookie);

    const token = parsed['ra_auth_token'];
    if (!token) return false;

    try {
      const payload = this.jwt.verify(token);

      client.data.user = {
        id: payload.sub ?? payload.id,
      };
      return true;
    } catch {
      return false;
    }
  }
}
