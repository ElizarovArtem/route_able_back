import {
  Body,
  Controller,
  Delete,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { RequestCodeDto } from './dto/request-code.dto';
import { RequestEmailCodeDto } from './dto/request-code-by-email.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('request-code')
  requestCode(@Body() dto: RequestCodeDto) {
    return this.authService.requestCode(dto.phone);
  }

  @Post('request-code-email')
  requestCodeByEmail(@Body() dto: RequestEmailCodeDto) {
    return this.authService.requestEmailCode(dto.email);
  }

  @Post('login')
  async verifyCode(
    @Body() dto: VerifyCodeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, refreshToken, user } = await this.authService.login(
      dto.phone,
      dto.code,
    );

    res.cookie('ra_auth_token', token, {
      httpOnly: true,
      expires: new Date(Date.now() + 1209600000),
      sameSite: 'lax',
      secure: false,
      domain: 'localhost',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('ra_refresh_token', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
      sameSite: 'lax',
      secure: false,
    });

    return { user };
  }

  @Post('login-by-email')
  async verifyCodeByEmail(
    @Body() dto: VerifyCodeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, refreshToken, user } = await this.authService.loginByEmail(
      dto.email,
      dto.code,
    );

    res.cookie('ra_auth_token', token, {
      httpOnly: true,
      expires: new Date(Date.now() + 1209600000),
      sameSite: 'lax',
      secure: false,
      // domain: 'localhost',
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('ra_refresh_token', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
      sameSite: 'lax',
      path: '/',
      secure: false,
    });

    return { user };
  }

  @Post('check-auth')
  async checkAuth(@Req() req: Request) {
    const token = req.cookies['ra_auth_token'];

    const { user } = await this.authService.checkAuth(token);

    return { user };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['ra_refresh_token'];
    if (!refreshToken) throw new UnauthorizedException();

    const { newAccessToken } = await this.authService.refresh(refreshToken);

    res.cookie('ra_auth_token', newAccessToken, {
      httpOnly: true,
      expires: new Date(Date.now() + 1209600000),
      sameSite: 'lax',
      secure: false,
      // domain: 'localhost',
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    return { success: true };
  }

  @Delete('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('ra_auth_token');
    res.clearCookie('ra_refresh_token');
    return { success: true };
  }
}
