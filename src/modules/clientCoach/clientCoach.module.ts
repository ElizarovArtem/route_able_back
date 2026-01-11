import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientCoach } from '../../entities/client-coach.entity';
import { User } from '../../entities/user.entity';
import { ClientCoachService } from './clientCoach.service';
import { ClientCoachController } from './clientCoach.controller';
import { Chat } from '../../entities/chat.entity';
import { MealModule } from '../meal/meal.module';

@Module({
  imports: [TypeOrmModule.forFeature([ClientCoach, User, Chat]), MealModule],
  controllers: [ClientCoachController],
  providers: [ClientCoachService],
  exports: [ClientCoachService],
})
export class ClientCoachModule {}
