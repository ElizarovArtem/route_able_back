import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  ParsedWebhookEvent,
  PaymentProvider,
} from '../../config/interfaces/payments';
import { SubscriptionPlan } from '../../entities/subscription-plan.entity';
import { UserSubscription } from '../../entities/user-subscription.entity';
import { SubscriptionPayment } from '../../entities/subscription-payment.entity';
import {
  PaidFeature,
  SubscriptionPaymentProvider,
  SubscriptionPaymentStatus,
  SubscriptionPeriod,
  SubscriptionPlanCode,
  SubscriptionPlanFeatures,
  SubscriptionStatus,
} from '../../config/emuns/subscription';
import { CreateSubscriptionCheckoutDto } from './dto/create-subscription-checkout.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { ChangeSubscriptionPlanDto } from './dto/change-subscription-plan.dto';
import { SubscriptionAccessService } from './subscription-access.service';
import { FeatureUsageService } from './feature-usage.service';
import { StubPaymentProvider } from '../payment/stub.provider';

@Injectable()
export class SubscriptionsService implements OnModuleInit {
  private readonly paymentProvider: PaymentProvider;

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(SubscriptionPlan)
    private readonly planRepo: Repository<SubscriptionPlan>,
    @InjectRepository(UserSubscription)
    private readonly subscriptionRepo: Repository<UserSubscription>,
    @InjectRepository(SubscriptionPayment)
    private readonly paymentRepo: Repository<SubscriptionPayment>,
    private readonly subscriptionAccessService: SubscriptionAccessService,
    private readonly featureUsageService: FeatureUsageService,
  ) {
    this.paymentProvider = new StubPaymentProvider();
  }

  async onModuleInit() {
    await this.ensureDefaultPlans();
  }

  async getActivePlans(): Promise<
    Array<{
      code: SubscriptionPlanCode;
      title: string;
      description: string;
      priceMonth: number | null;
      priceYear: number | null;
      discount: number;
      benefits: string[];
    }>
  > {
    const plans = await this.planRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });

    const grouped = new Map<SubscriptionPlanCode, SubscriptionPlan[]>();

    for (const plan of plans) {
      const current = grouped.get(plan.code) ?? [];
      current.push(plan);
      grouped.set(plan.code, current);
    }

    return Array.from(grouped.entries())
      .map(([code, planVariants]) => this.mapPlanCard(code, planVariants))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(({ sortOrder, ...plan }) => plan);
  }

  async getMySubscription(userId: string) {
    const subscription =
      await this.subscriptionAccessService.getCurrentSubscription(userId);
    const freePlan = !subscription
      ? await this.planRepo.findOne({
          where: {
            code: SubscriptionPlanCode.FREE,
            period: SubscriptionPeriod.MONTH,
            isActive: true,
          },
        })
      : null;
    const entitlements =
      subscription?.plan?.features ??
      freePlan?.features ??
      this.getDefaultFeatures(SubscriptionPlanCode.FREE);
    const usage = await this.featureUsageService.getUsages(userId);

    return {
      subscription,
      plan: subscription?.plan ?? freePlan ?? null,
      features: entitlements,
      usage,
    };
  }

  async getPaymentStatus(userId: string, paymentId: string) {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId, userId },
      relations: { userSubscription: { plan: true } },
    });

    if (!payment) {
      throw new NotFoundException({
        code: 'PAYMENT_NOT_FOUND',
        message: 'Subscription payment not found',
      });
    }

    return {
      paymentId: payment.id,
      subscriptionId: payment.userSubscriptionId ?? null,
      paymentStatus: payment.status,
      subscriptionStatus: payment.userSubscription?.status ?? null,
      provider: payment.provider,
      paidAt: payment.paidAt ?? null,
      startAt: payment.userSubscription?.startAt ?? null,
      endAt: payment.userSubscription?.endAt ?? null,
      planCode: payment.userSubscription?.plan?.code ?? null,
      period: payment.userSubscription?.plan?.period ?? null,
    };
  }

  async createCheckout(
    userId: string,
    dto: CreateSubscriptionCheckoutDto,
  ): Promise<{
    subscriptionId: string;
    paymentId: string;
    status: SubscriptionStatus;
    paymentStatus: SubscriptionPaymentStatus;
    provider: SubscriptionPaymentProvider;
    paymentUrl: string | null;
  }> {
    const plan = await this.findActivePlanOrThrow(dto.planCode, dto.period);

    if (plan.code === SubscriptionPlanCode.FREE || Number(plan.price) <= 0) {
      throw new BadRequestException({
        code: 'PLAN_NOT_FOUND',
        message: 'Free plan does not require checkout',
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const subscriptionRepo = manager.getRepository(UserSubscription);
      const paymentRepo = manager.getRepository(SubscriptionPayment);

      const subscription = subscriptionRepo.create({
        userId,
        planId: plan.id,
        status: SubscriptionStatus.PENDING,
      });

      const savedSubscription = await subscriptionRepo.save(subscription);

      const providerResult = await this.paymentProvider.createPayment({
        orderId: savedSubscription.id,
        amount: Number(plan.price),
        currency: plan.currency,
        description: `Оплата подписки ${plan.code}_${plan.period}`,
        customerId: userId,
      });

      const payment = paymentRepo.create({
        userId,
        userSubscriptionId: savedSubscription.id,
        provider: SubscriptionPaymentProvider.STUB,
        status: SubscriptionPaymentStatus.PENDING,
        amount: plan.price,
        currency: plan.currency,
        externalPaymentId: providerResult.externalPaymentId,
        rawPayload: {
          planCode: plan.code,
          period: plan.period,
          paymentUrl: providerResult.paymentUrl ?? null,
          providerRaw: providerResult.raw ?? null,
        },
      });

      const savedPayment = await paymentRepo.save(payment);

      return {
        subscriptionId: savedSubscription.id,
        paymentId: savedPayment.id,
        status: savedSubscription.status,
        paymentStatus: savedPayment.status,
        provider: savedPayment.provider,
        paymentUrl: providerResult.paymentUrl ?? null,
      };
    });
  }

  async handleWebhook(payload: unknown, headers?: Record<string, string>) {
    const event = await this.paymentProvider.parseWebhook(payload, headers);
    return this.handleSubscriptionPaymentWebhook(event);
  }

  async activateStubSubscription(
    userId: string,
    payload: { subscriptionId?: string; paymentId?: string },
  ) {
    if (process.env.NODE_ENV === 'production') {
      throw new BadRequestException({
        code: 'STUB_PAYMENTS_DISABLED_IN_PRODUCTION',
        message: 'Stub payments are disabled in production',
      });
    }

    if (!payload.subscriptionId && !payload.paymentId) {
      throw new BadRequestException({
        code: 'PAYMENT_NOT_FOUND',
        message: 'subscriptionId or paymentId is required',
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const subscriptionRepo = manager.getRepository(UserSubscription);
      const paymentRepo = manager.getRepository(SubscriptionPayment);

      const payment = payload.paymentId
        ? await paymentRepo.findOne({
            where: { id: payload.paymentId, userId },
          })
        : await paymentRepo.findOne({
            where: {
              userSubscriptionId: payload.subscriptionId,
              userId,
            },
          });

      if (!payment) {
        throw new NotFoundException({
          code: 'PAYMENT_NOT_FOUND',
          message: 'Subscription payment not found',
        });
      }

      const subscription = await subscriptionRepo.findOne({
        where: { id: payment.userSubscriptionId, userId },
        relations: { plan: true },
      });

      if (!subscription) {
        throw new NotFoundException({
          code: 'SUBSCRIPTION_NOT_FOUND',
          message: 'Subscription not found',
        });
      }

      const now = new Date();
      await this.markOtherSubscriptionsExpired(
        subscriptionRepo,
        userId,
        subscription.id,
        now,
      );

      await this.markPaymentSucceeded(paymentRepo, payment, now);
      await this.activateSubscription(subscriptionRepo, subscription, now);

      return {
        subscriptionId: subscription.id,
        paymentId: payment.id,
        status: subscription.status,
        paymentStatus: payment.status,
        startAt: subscription.startAt,
        endAt: subscription.endAt,
      };
    });
  }

  async cancelSubscription(userId: string, dto: CancelSubscriptionDto) {
    const subscription =
      await this.subscriptionAccessService.getCurrentSubscription(userId);

    if (!subscription) {
      throw new NotFoundException({
        code: 'SUBSCRIPTION_NOT_FOUND',
        message: 'Active subscription not found',
      });
    }

    subscription.cancelAtPeriodEnd = true;
    subscription.canceledAt = new Date();

    await this.subscriptionRepo.save(subscription);

    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      canceledAt: subscription.canceledAt,
      reason: dto.reason ?? null,
    };
  }

  async changePlan(userId: string, dto: ChangeSubscriptionPlanDto) {
    const period = dto.period ?? SubscriptionPeriod.MONTH;
    const current = await this.subscriptionAccessService.getCurrentSubscription(
      userId,
    );
    const plan = await this.findActivePlanOrThrow(dto.planCode, period);

    if (current?.planId === plan.id) {
      throw new BadRequestException({
        code: 'PLAN_ALREADY_ACTIVE',
        message: 'Requested plan is already active',
      });
    }

    return this.createCheckout(userId, {
      planCode: dto.planCode,
      period,
    });
  }

  async ensureDefaultPlans() {
    const defaults = this.getDefaultPlans();

    for (const item of defaults) {
      const existing = await this.planRepo.findOne({
        where: { code: item.code, period: item.period },
      });

      if (!existing) {
        await this.planRepo.save(this.planRepo.create(item));
        continue;
      }

      existing.name = item.name;
      existing.description = item.description;
      existing.features = item.features;
      existing.sortOrder = item.sortOrder;
      existing.isActive = item.isActive;
      existing.currency = item.currency;
      existing.price = item.price;

      await this.planRepo.save(existing);
    }
  }

  private async findActivePlanOrThrow(
    code: SubscriptionPlanCode,
    period: SubscriptionPeriod,
  ): Promise<SubscriptionPlan> {
    const plan = await this.planRepo.findOne({
      where: { code, period, isActive: true },
    });

    if (!plan) {
      throw new NotFoundException({
        code: 'PLAN_NOT_FOUND',
        message: 'Subscription plan not found',
      });
    }

    return plan;
  }

  private addPeriod(date: Date, period: SubscriptionPeriod): Date {
    const next = new Date(date);

    if (period === SubscriptionPeriod.YEAR) {
      next.setUTCFullYear(next.getUTCFullYear() + 1);
      return next;
    }

    next.setUTCMonth(next.getUTCMonth() + 1);
    return next;
  }

  private async handleSubscriptionPaymentWebhook(event: ParsedWebhookEvent) {
    return this.dataSource.transaction(async (manager) => {
      const paymentRepo = manager.getRepository(SubscriptionPayment);
      const subscriptionRepo = manager.getRepository(UserSubscription);

      const payment = await paymentRepo.findOne({
        where: { externalPaymentId: event.externalPaymentId },
        relations: { userSubscription: { plan: true } },
      });

      if (!payment) {
        throw new NotFoundException({
          code: 'PAYMENT_NOT_FOUND',
          message: 'Subscription payment not found',
        });
      }

      const subscription = payment.userSubscription;

      if (!subscription) {
        throw new NotFoundException({
          code: 'SUBSCRIPTION_NOT_FOUND',
          message: 'Subscription not found for payment',
        });
      }

      payment.rawPayload = {
        ...(payment.rawPayload ?? {}),
        webhook: event.raw ?? null,
      };

      if (event.status === 'PAID') {
        const now = new Date();
        await this.markOtherSubscriptionsExpired(
          subscriptionRepo,
          payment.userId,
          subscription.id,
          now,
        );
        await this.markPaymentSucceeded(paymentRepo, payment, now);
        await this.activateSubscription(subscriptionRepo, subscription, now);
        return { ok: true };
      }

      if (event.status === 'FAILED') {
        payment.status = SubscriptionPaymentStatus.FAILED;
        payment.failureReason = 'Payment failed via webhook';
        subscription.status = SubscriptionStatus.PAST_DUE;
        await paymentRepo.save(payment);
        await subscriptionRepo.save(subscription);
        return { ok: true };
      }

      if (event.status === 'CANCELED') {
        payment.status = SubscriptionPaymentStatus.CANCELED;
        payment.failureReason = 'Payment canceled via webhook';
        subscription.status = SubscriptionStatus.CANCELED;
        subscription.canceledAt = new Date();
        await paymentRepo.save(payment);
        await subscriptionRepo.save(subscription);
        return { ok: true };
      }

      if (event.status === 'REFUNDED') {
        payment.status = SubscriptionPaymentStatus.REFUNDED;
        subscription.status = SubscriptionStatus.CANCELED;
        subscription.canceledAt = new Date();
        await paymentRepo.save(payment);
        await subscriptionRepo.save(subscription);
        return { ok: true };
      }

      return { ok: true };
    });
  }

  private async markOtherSubscriptionsExpired(
    subscriptionRepo: Repository<UserSubscription>,
    userId: string,
    exceptSubscriptionId: string,
    now: Date,
  ) {
    const current = await subscriptionRepo.find({
      where: [
        { userId, status: SubscriptionStatus.ACTIVE },
        { userId, status: SubscriptionStatus.TRIALING },
      ],
    });

    for (const activeSubscription of current) {
      if (activeSubscription.id === exceptSubscriptionId) {
        continue;
      }

      activeSubscription.status = SubscriptionStatus.EXPIRED;
      activeSubscription.endAt = now;
      activeSubscription.cancelAtPeriodEnd = false;
      await subscriptionRepo.save(activeSubscription);
    }
  }

  private async markPaymentSucceeded(
    paymentRepo: Repository<SubscriptionPayment>,
    payment: SubscriptionPayment,
    paidAt: Date,
  ) {
    payment.status = SubscriptionPaymentStatus.SUCCEEDED;
    payment.paidAt = paidAt;
    await paymentRepo.save(payment);
  }

  private async activateSubscription(
    subscriptionRepo: Repository<UserSubscription>,
    subscription: UserSubscription,
    startAt: Date,
  ) {
    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.startAt = startAt;
    subscription.endAt = this.addPeriod(startAt, subscription.plan.period);
    subscription.cancelAtPeriodEnd = false;
    subscription.canceledAt = null;
    await subscriptionRepo.save(subscription);
  }

  private getDefaultPlans(): Array<Partial<SubscriptionPlan>> {
    return [
      {
        code: SubscriptionPlanCode.FREE,
        period: SubscriptionPeriod.MONTH,
        name: 'Free',
        description: 'Базовый бесплатный тариф',
        price: '0.00',
        currency: 'RUB',
        features: this.getDefaultFeatures(SubscriptionPlanCode.FREE),
        isActive: true,
        sortOrder: 0,
      },
      {
        code: SubscriptionPlanCode.PREMIUM,
        period: SubscriptionPeriod.MONTH,
        name: 'Premium Monthly',
        description: 'Помесячный тариф Premium',
        price: '990.00',
        currency: 'RUB',
        features: this.getDefaultFeatures(SubscriptionPlanCode.PREMIUM),
        isActive: true,
        sortOrder: 10,
      },
      {
        code: SubscriptionPlanCode.PRO,
        period: SubscriptionPeriod.MONTH,
        name: 'Pro Monthly',
        description: 'Помесячный тариф Pro',
        price: '1990.00',
        currency: 'RUB',
        features: this.getDefaultFeatures(SubscriptionPlanCode.PRO),
        isActive: true,
        sortOrder: 20,
      },
      {
        code: SubscriptionPlanCode.PREMIUM,
        period: SubscriptionPeriod.YEAR,
        name: 'Premium Yearly',
        description: 'Годовой тариф Premium',
        price: '9990.00',
        currency: 'RUB',
        features: this.getDefaultFeatures(SubscriptionPlanCode.PREMIUM),
        isActive: true,
        sortOrder: 30,
      },
      {
        code: SubscriptionPlanCode.PRO,
        period: SubscriptionPeriod.YEAR,
        name: 'Pro Yearly',
        description: 'Годовой тариф Pro',
        price: '19990.00',
        currency: 'RUB',
        features: this.getDefaultFeatures(SubscriptionPlanCode.PRO),
        isActive: true,
        sortOrder: 40,
      },
    ];
  }

  private getDefaultFeatures(
    code: SubscriptionPlanCode,
  ): SubscriptionPlanFeatures {
    if (code === SubscriptionPlanCode.PREMIUM) {
      return {
        [PaidFeature.AI_CHAT]: { enabled: true, monthlyLimit: 300 },
        [PaidFeature.AI_FOOD_LOGGING]: { enabled: true, monthlyLimit: 100 },
        [PaidFeature.AI_PHOTO_ANALYSIS]: { enabled: true, monthlyLimit: 30 },
        [PaidFeature.AI_WORKOUT_GENERATION]: {
          enabled: true,
          monthlyLimit: 20,
        },
      };
    }

    if (code === SubscriptionPlanCode.PRO) {
      return {
        [PaidFeature.AI_CHAT]: { enabled: true, monthlyLimit: 1500 },
        [PaidFeature.AI_FOOD_LOGGING]: { enabled: true, monthlyLimit: 500 },
        [PaidFeature.AI_PHOTO_ANALYSIS]: { enabled: true, monthlyLimit: 150 },
        [PaidFeature.AI_WORKOUT_GENERATION]: {
          enabled: true,
          monthlyLimit: 100,
        },
      };
    }

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

  private mapPlanCard(
    code: SubscriptionPlanCode,
    planVariants: SubscriptionPlan[],
  ) {
    const monthPlan = planVariants.find(
      (plan) => plan.period === SubscriptionPeriod.MONTH,
    );
    const yearPlan = planVariants.find(
      (plan) => plan.period === SubscriptionPeriod.YEAR,
    );
    const basePlan = monthPlan ?? yearPlan;
    const meta = this.getPlanPresentation(code);

    const priceMonth = monthPlan ? Number(monthPlan.price) : null;
    const priceYear = yearPlan ? Number(yearPlan.price) : null;
    const discount =
      priceMonth && priceYear
        ? Math.max(0, Math.round((1 - priceYear / (priceMonth * 12)) * 100))
        : 0;

    return {
      code,
      title: meta.title,
      description: meta.description,
      priceMonth,
      priceYear,
      discount,
      benefits: this.getBenefitsForPlan(code, basePlan?.features ?? {}),
      sortOrder: basePlan?.sortOrder ?? 0,
    };
  }

  private getPlanPresentation(code: SubscriptionPlanCode): {
    title: string;
    description: string;
  } {
    switch (code) {
      case SubscriptionPlanCode.PREMIUM:
        return {
          title: 'Premium',
          description: 'Оптимально для более быстрого достижения результата',
        };
      case SubscriptionPlanCode.PRO:
        return {
          title: 'Pro',
          description: 'Максимум AI-возможностей и повышенные лимиты',
        };
      case SubscriptionPlanCode.FREE:
      default:
        return {
          title: 'Free',
          description: 'Базовый доступ к платформе без платных AI-функций',
        };
    }
  }

  private getBenefitsForPlan(
    code: SubscriptionPlanCode,
    features: SubscriptionPlanFeatures,
  ): string[] {
    if (code === SubscriptionPlanCode.FREE) {
      return [
        'Основной функционал сайта',
        'Ассистент при выполнении упражнений',
        'Ведение питания',
        'Список тренеров',
      ];
    }

    const benefits = ['Весь функционал базового тарифа'];

    if (features[PaidFeature.AI_CHAT]?.enabled) {
      benefits.push(
        `AI-чат: до ${
          features[PaidFeature.AI_CHAT]?.monthlyLimit
        } запросов в месяц`,
      );
    }

    if (features[PaidFeature.AI_FOOD_LOGGING]?.enabled) {
      benefits.push(
        `AI-разбор еды по тексту: до ${
          features[PaidFeature.AI_FOOD_LOGGING]?.monthlyLimit
        } запросов в месяц`,
      );
    }

    if (features[PaidFeature.AI_PHOTO_ANALYSIS]?.enabled) {
      benefits.push(
        `AI-анализ фото еды: до ${
          features[PaidFeature.AI_PHOTO_ANALYSIS]?.monthlyLimit
        } запросов в месяц`,
      );
    }

    if (features[PaidFeature.AI_WORKOUT_GENERATION]?.enabled) {
      benefits.push(
        `AI-генерация тренировок: до ${
          features[PaidFeature.AI_WORKOUT_GENERATION]?.monthlyLimit
        } запросов в месяц`,
      );
    }

    return benefits;
  }
}
