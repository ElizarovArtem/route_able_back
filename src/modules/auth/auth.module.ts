import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthCodes } from '../../entities /auth.entity';
import { JwtModule } from '@nestjs/jwt';
import { SmsService } from './auth.sms.service';
import { UserService } from '../user/user.service';
import { User } from '../../entities /user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuthCodes, User]),
    JwtModule.register({
      secret: 'jwt-secret-key', // вынеси в ENV!
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SmsService, UserService],
})
export class AuthModule {}
