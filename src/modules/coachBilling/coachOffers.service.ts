import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCoachOfferDto } from './dto/create-coach-offer.dto';
import { CoachOffer, CoachOfferType } from '../../entities/coach-offer.entity';
import { User } from '../../entities/user.entity';
import { Roles } from '../../config/emuns/user';

@Injectable()
export class CoachOffersService {
  constructor(
    @InjectRepository(CoachOffer)
    private readonly offerRepo: Repository<CoachOffer>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(coachId: string, dto: CreateCoachOfferDto) {
    const coach = await this.userRepo.findOne({ where: { id: coachId } });
    if (!coach) throw new NotFoundException('Coach not found');
    if (!coach.roles?.includes(Roles.Coach)) {
      throw new BadRequestException('User is not a coach');
    }

    const offer = this.offerRepo.create({
      coachId,
      title: dto.title,
      description: dto.description ?? null,
      type:
        dto.sessionCount > 1
          ? CoachOfferType.SESSION_PACK
          : CoachOfferType.SINGLE_SESSION,
      sessionCount: dto.sessionCount,
      price: dto.price,
      currency: dto.currency ?? 'RUB',
      isActive: true,
    });

    return this.offerRepo.save(offer);
  }

  async getCoachOffers(coachId: string) {
    return this.offerRepo.find({
      where: { coachId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }
}
