import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'patiy_parol97',
  database: 'route_able',
  // Согласуй пути с тем, как ты называешь сущности!
  entities: ['src/entities/**/*.{ts,js}'],
  migrations: ['src/migrations/**/*.{ts,js}'],
  synchronize: false,
  logging: false,
});
