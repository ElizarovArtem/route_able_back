import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionAccessService } from './subscription-access.service';
import { FeatureUsageService } from './feature-usage.service';
import { SubscriptionPlan } from '../../entities/subscription-plan.entity';
import { UserSubscription } from '../../entities/user-subscription.entity';
import { SubscriptionPayment } from '../../entities/subscription-payment.entity';
import { FeatureUsage } from '../../entities/feature-usage.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubscriptionPlan,
      UserSubscription,
      SubscriptionPayment,
      FeatureUsage,
    ]),
  ],
  controllers: [SubscriptionsController],
  providers: [
    SubscriptionsService,
    SubscriptionAccessService,
    FeatureUsageService,
  ],
  exports: [SubscriptionAccessService, FeatureUsageService],
})
export class SubscriptionsModule {}
