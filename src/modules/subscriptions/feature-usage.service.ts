import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureUsage } from '../../entities/feature-usage.entity';
import { PaidFeature } from '../../config/emuns/subscription';

@Injectable()
export class FeatureUsageService {
  constructor(
    @InjectRepository(FeatureUsage)
    private readonly usageRepo: Repository<FeatureUsage>,
  ) {}

  getCurrentPeriod(now = new Date()): { periodStart: Date; periodEnd: Date } {
    const periodStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
    );
    const periodEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
    );

    return { periodStart, periodEnd };
  }

  async getUsage(userId: string, feature: PaidFeature): Promise<FeatureUsage> {
    const { periodStart, periodEnd } = this.getCurrentPeriod();
    await this.usageRepo.upsert(
      {
        userId,
        feature,
        periodStart,
        periodEnd,
        used: 0,
        limit: 0,
      },
      ['userId', 'feature', 'periodStart', 'periodEnd'],
    );

    const usage = await this.usageRepo.findOne({
      where: { userId, feature, periodStart, periodEnd },
    });

    if (!usage) {
      throw new ForbiddenException({
        code: 'FEATURE_LIMIT_REACHED',
        message: 'Failed to initialize usage period',
      });
    }

    return usage;
  }

  async getUsages(userId: string): Promise<FeatureUsage[]> {
    const { periodStart, periodEnd } = this.getCurrentPeriod();

    return this.usageRepo.find({
      where: { userId, periodStart, periodEnd },
      order: { feature: 'ASC' },
    });
  }

  async consume(
    userId: string,
    feature: PaidFeature,
    limit: number,
    amount = 1,
  ): Promise<FeatureUsage> {
    const usage = await this.getUsage(userId, feature);

    if (usage.used + amount > limit) {
      throw new ForbiddenException({
        code: 'FEATURE_LIMIT_REACHED',
        message: 'Feature monthly limit reached',
      });
    }

    usage.limit = limit;
    usage.used += amount;

    return this.usageRepo.save(usage);
  }
}
