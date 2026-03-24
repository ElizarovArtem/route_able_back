import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateCoachOfferDto } from './dto/create-coach-offer.dto';
import { CoachOffersService } from './coachOffers.service';
import { JwtAuthGuard } from '../../libs/guards/auth.guard';
import { RolesGuard } from '../../libs/guards/roles.guard';
import { RolesDecorator } from '../../config/decorators/roles.decorator';
import { Roles } from '../../config/emuns/user';

@Controller('coach-offers')
@UseGuards(JwtAuthGuard)
export class CoachOffersController {
  constructor(private readonly service: CoachOffersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @RolesDecorator(Roles.Coach)
  async create(@Req() req: any, @Body() dto: CreateCoachOfferDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get('coach/:coachId')
  async list(@Param('coachId') coachId: string) {
    return this.service.getCoachOffers(coachId);
  }
}
