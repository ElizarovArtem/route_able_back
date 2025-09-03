import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TraineeCoach } from '../../entities/trainee-coach.entity';
import { User } from '../../entities/user.entity';
import { Roles } from '../../config/emuns/user';

@Injectable()
export class RelationsService {
  constructor(
    @InjectRepository(TraineeCoach) private links: Repository<TraineeCoach>,
    @InjectRepository(User) private users: Repository<User>,
  ) {}

  /**
   * Инициатор = Trainee, второй пользователь обязан быть Coach.
   * Возвращает существующую или создаёт новую активную связь.
   */
  async ensureLinkWithCoach(initiatorId: string, otherUserId: string) {
    if (initiatorId === otherUserId) {
      throw new BadRequestException('Нельзя создать чат с самим собой');
    }
    const other = await this.users.findOne({ where: { id: otherUserId } });
    if (!other) throw new BadRequestException('Пользователь не найден');
    if (!other.roles.includes(Roles.Coach))
      throw new BadRequestException('Второй пользователь должен быть тренером');

    // ищем/создаём пару
    const existing = await this.links.findOne({
      where: { traineeId: initiatorId, coachId: otherUserId },
    });
    if (existing) return existing;

    return this.links.save(
      this.links.create({ traineeId: initiatorId, coachId: otherUserId }),
    );
  }
}
