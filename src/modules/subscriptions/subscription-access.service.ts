import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSubscription } from '../../entities/user-subscription.entity';
import {
  PaidFeature,
  SubscriptionPlanFeatures,
  SubscriptionStatus,
} from '../../config/emuns/subscription';
import { FeatureUsageService } from './feature-usage.service';

@Injectable()
export class SubscriptionAccessService {
  constructor(
    @InjectRepository(UserSubscription)
    private readonly subscriptionRepo: Repository<UserSubscription>,
    private readonly featureUsageService: FeatureUsageService,
  ) {}

  async getCurrentSubscription(
    userId: string,
  ): Promise<UserSubscription | null> {
    const subscriptions = await this.subscriptionRepo.find({
      where: [
        { userId, status: SubscriptionStatus.ACTIVE },
        { userId, status: SubscriptionStatus.TRIALING },
      ],
      relations: { plan: true },
      order: {
        updatedAt: 'DESC',
        createdAt: 'DESC',
      },
    });

    const now = new Date();

    for (const subscription of subscriptions) {
      if (this.isSubscriptionCurrent(subscription, now)) {
        return subscription;
      }
    }

    return null;
  }

  async getEntitlements(userId: string): Promise<SubscriptionPlanFeatures> {
    const subscription = await this.getCurrentSubscription(userId);
    return subscription?.plan?.features ?? this.getFreeEntitlements();
  }

  async getFeatureLimit(userId: string, feature: PaidFeature): Promise<number> {
    const entitlements = await this.getEntitlements(userId);
    return entitlements[feature]?.monthlyLimit ?? 0;
  }

  async canUseFeature(userId: string, feature: PaidFeature): Promise<boolean> {
    try {
      await this.assertCanUseFeature(userId, feature);
      return true;
    } catch {
      return false;
    }
  }

  async assertCanUseFeature(
    userId: string,
    feature: PaidFeature,
  ): Promise<void> {
    const subscription = await this.getCurrentSubscription(userId);

    if (!subscription) {
      throw new ForbiddenException({
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'Active subscription is required',
      });
    }

    const config = subscription.plan?.features?.[feature];

    if (!config?.enabled) {
      throw new ForbiddenException({
        code: 'FEATURE_NOT_INCLUDED',
        message: 'Feature is not included in current subscription',
      });
    }

    const usage = await this.featureUsageService.getUsage(userId, feature);

    if (config.monthlyLimit >= 0 && usage.used >= config.monthlyLimit) {
      throw new ForbiddenException({
        code: 'FEATURE_LIMIT_REACHED',
        message: 'Feature monthly limit reached',
      });
    }
  }

  private isSubscriptionCurrent(
    subscription: UserSubscription,
    now: Date,
  ): boolean {
    if (
      subscription.status !== SubscriptionStatus.ACTIVE &&
      subscription.status !== SubscriptionStatus.TRIALING
    ) {
      return false;
    }

    if (subscription.startAt && subscription.startAt > now) {
      return false;
    }

    if (subscription.status === SubscriptionStatus.TRIALING) {
      if (!subscription.trialEndsAt) {
        return true;
      }

      return subscription.trialEndsAt >= now;
    }

    if (!subscription.endAt) {
      return true;
    }

    return subscription.endAt >= now;
  }

  private getFreeEntitlements(): SubscriptionPlanFeatures {
    return {
      [PaidFeature.AI_CHAT]: { enabled: false, monthlyLimit: 0 },
      [PaidFeature.AI_FOOD_LOGGING]: { enabled: false, monthlyLimit: 0 },
      [PaidFeature.AI_PHOTO_ANALYSIS]: { enabled: false, monthlyLimit: 0 },
      [PaidFeature.AI_WORKOUT_GENERATION]: {
        enabled: false,
        monthlyLimit: 0,
      },
    };
  }
}
