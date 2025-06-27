import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Day } from '../../entities /day.entity';
import { User } from '../../entities /user.entity';

@Injectable()
export class DayService {
  constructor(
    @InjectRepository(Day)
    private readonly dayRepo: Repository<Day>,
  ) {}

  async getOrCreateDay(user: User, date: string): Promise<Day> {
    let day = await this.dayRepo.findOne({
      where: { user: { id: user.id }, date },
    });

    if (!day) {
      day = this.dayRepo.create({ user, date });
      await this.dayRepo.save(day);
    }

    return day;
  }

  async findByDate(user: User, date: string): Promise<Day | null> {
    return this.dayRepo.findOne({
      where: { user: { id: user.id }, date },
      relations: ['meals', 'workouts'],
    });
  }

  async getAllDays(user: User): Promise<Day[]> {
    return this.dayRepo.find({
      where: { user: { id: user.id } },
      order: { date: 'DESC' },
    });
  }

  async updateNote(user: User, date: string, note: string): Promise<Day> {
    const day = await this.getOrCreateDay(user, date);
    day.note = note;
    return this.dayRepo.save(day);
  }
}
