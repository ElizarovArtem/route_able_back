import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { AuthCodes } from '../../entities/auth.entity';
import { Day } from '../../entities/day.entity';
import { Meal } from '../../entities/meal.entity';
import { MealModule } from '../meal/meal.module';
import { DayModule } from '../day/day.module';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from '../chat/chat.module';
import { Chat } from '../../entities/chat.entity';
import { ChatParticipant } from '../../entities/chat-participant.entity';
import { Message } from '../../entities/message.entity';
import { TraineeCoach } from '../../entities/trainee-coach.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'patiy_parol97',
      database: 'route_able',
      entities: [
        User,
        AuthCodes,
        Day,
        Meal,
        Chat,
        ChatParticipant,
        Message,
        TraineeCoach,
      ],
      synchronize: true, // Только для разработки
    }),
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    UserModule,
    AuthModule,
    MealModule,
    DayModule,
    ChatModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
