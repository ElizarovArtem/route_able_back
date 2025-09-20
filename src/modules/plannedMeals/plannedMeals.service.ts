import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientCoach } from '../../entities/client-coach.entity';
import { PlannedMeal } from '../../entities/planned-meal.entity';

@Injectable()
export class PlannedMealsService {
  constructor(
    @InjectRepository(PlannedMeal) private planned: Repository<PlannedMeal>,
    @InjectRepository(ClientCoach) private links: Repository<ClientCoach>,
  ) {}

  private async getLink(meId: string, relationId: string) {
    const link = await this.links.findOne({ where: { id: relationId } });
    if (!link) throw new NotFoundException('Связь не найдена');
    if (meId !== link.clientId && meId !== link.coachId)
      throw new NotFoundException();
    return link;
  }

  // Добавляет только тренер
  async create(
    meId: string,
    relationId: string,
    dto: { text: string; date: string; slot?: any },
  ) {
    const link = await this.getLink(meId, relationId);
    if (meId !== link.coachId)
      throw new ForbiddenException('Только тренер может назначать приёмы');

    const entry = this.planned.create({
      clientCoachId: link.id,
      clientId: link.clientId,
      coachId: link.coachId,
      authorId: meId,
      text: dto.text,
      date: dto.date,
      slot: dto.slot,
    });
    return this.planned.save(entry);
  }

  // Список плановых приёмов на дату (и клиент, и тренер видят)
  async listForDate(meId: string, relationId: string, date: string) {
    const link = await this.getLink(meId, relationId);
    return this.planned.find({
      where: { clientCoachId: link.id, date },
      order: { createdAt: 'ASC' },
    });
  }
}
