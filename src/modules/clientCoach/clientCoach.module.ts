import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientCoach } from '../../entities/client-coach.entity';
import { User } from '../../entities/user.entity';
import { ClientCoachService } from './clientCoach.service';
import { ClientCoachController } from './clientCoach.controller';
import { Chat } from '../../entities/chat.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClientCoach, User, Chat])],
  controllers: [ClientCoachController],
  providers: [ClientCoachService],
  exports: [ClientCoachService],
})
export class ClientCoachModule {}
