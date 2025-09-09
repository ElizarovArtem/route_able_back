import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientCoach } from '../../entities/client-coach.entity';
import { User } from '../../entities/user.entity';
import { RelationsService } from './relations.service';
import { RelationsController } from './relations.controller';
import { Chat } from '../../entities/chat.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClientCoach, User, Chat])],
  controllers: [RelationsController],
  providers: [RelationsService],
  exports: [RelationsService],
})
export class RelationsModule {}
