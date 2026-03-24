import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { StubPaymentProvider } from './stub.provider';
import { CoachOrder } from '../../entities/coach-order.entity';
import { CoachBillingModule } from '../coachBilling/coachBilling.module';
import { PAYMENT_PROVIDER } from '../../config/constants/payments';

@Module({
  imports: [TypeOrmModule.forFeature([CoachOrder]), CoachBillingModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    {
      provide: PAYMENT_PROVIDER,
      useClass: StubPaymentProvider,
    },
  ],
  exports: [PaymentsService, PAYMENT_PROVIDER],
})
export class PaymentsModule {}
