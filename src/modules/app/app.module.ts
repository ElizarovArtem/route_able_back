import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities /user.entity';
import { AuthModule } from '../auth/auth.module';
import { AuthCodes } from '../../entities /auth.entity';
import { Day } from '../../entities /day.entity';
import { Meal } from '../../entities /meal.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'patiy_parol97',
      database: 'route_able',
      entities: [User, AuthCodes, Day, Meal],
      synchronize: true, // Только для разработки
    }),
    UserModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
