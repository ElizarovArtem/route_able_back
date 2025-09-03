import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TraineeCoach } from '../../entities/trainee-coach.entity';
import { User } from '../../entities/user.entity';
import { RelationsService } from './relations.service';

@Module({
  imports: [TypeOrmModule.forFeature([TraineeCoach, User])],
  providers: [RelationsService],
  exports: [RelationsService],
})
export class RelationsModule {}
