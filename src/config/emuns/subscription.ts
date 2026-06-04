export enum SubscriptionPlanCode {
  FREE = 'free',
  PREMIUM = 'premium',
  PRO = 'pro',
}

export enum SubscriptionPeriod {
  MONTH = 'month',
  YEAR = 'year',
}

export enum SubscriptionStatus {
  PENDING = 'pending',
  TRIALING = 'trialing',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
}

export enum SubscriptionPaymentStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELED = 'canceled',
  REFUNDED = 'refunded',
}

export enum SubscriptionPaymentProvider {
  STUB = 'stub',
  STRIPE = 'stripe',
  YOOKASSA = 'yookassa',
  CLOUDPAYMENTS = 'cloudpayments',
  MANUAL = 'manual',
}

export enum PaidFeature {
  AI_CHAT = 'ai_chat',
  AI_FOOD_LOGGING = 'ai_food_logging',
  AI_PHOTO_ANALYSIS = 'ai_photo_analysis',
  AI_WORKOUT_GENERATION = 'ai_workout_generation',
}

export interface SubscriptionFeatureConfig {
  enabled: boolean;
  monthlyLimit: number;
}

export type SubscriptionPlanFeatures = Partial<
  Record<PaidFeature, SubscriptionFeatureConfig>
>;
