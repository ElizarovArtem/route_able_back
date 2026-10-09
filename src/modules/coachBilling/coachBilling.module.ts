import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoachOffer } from '../../entities/coach-offer.entity';
import { CoachOrder } from '../../entities/coach-order.entity';
import { ClientCoach } from '../../entities/client-coach.entity';
import { ClientCoachTransaction } from '../../entities/client-coach-transaction.entity';
import { User } from '../../entities/user.entity';
import { CoachOffersController } from './coachOffers.controller';
import { CoachOrdersController } from './coachOrders.controller';
import { CoachBillingService } from './coachBilling.service';
import { CoachOffersService } from './coachOffers.service';
import { SessionBalanceService } from './session-balance.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CoachOffer,
      CoachOrder,
      ClientCoach,
      ClientCoachTransaction,
      User,
    ]),
  ],
  controllers: [CoachOffersController, CoachOrdersController],
  providers: [CoachBillingService, CoachOffersService, SessionBalanceService],
  exports: [CoachBillingService, CoachOffersService, SessionBalanceService],
})
export class CoachBillingModule {}
