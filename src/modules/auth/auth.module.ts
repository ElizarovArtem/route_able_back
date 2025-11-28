import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthCodes } from '../../entities/auth.entity';
import { JwtModule } from '@nestjs/jwt';
import { SmsService } from './auth.sms.service';
import { UserService } from '../user/user.service';
import { User } from '../../entities/user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../../libs/guards/auth.guard';
import { MailService } from './auth.email.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    TypeOrmModule.forFeature([AuthCodes, User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET_KEY'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SmsService, UserService, JwtStrategy, MailService],
})
export class AuthModule {}
