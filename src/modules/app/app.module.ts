import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'patiy_parol97',
      database: 'route_able',
      entities: [User],
      synchronize: true, // Только для разработки
    }),
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
