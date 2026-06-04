import { IsEnum } from 'class-validator';
import {
  SubscriptionPeriod,
  SubscriptionPlanCode,
} from '../../../config/emuns/subscription';

export class CreateSubscriptionCheckoutDto {
  @IsEnum(SubscriptionPlanCode)
  planCode: SubscriptionPlanCode;

  @IsEnum(SubscriptionPeriod)
  period: SubscriptionPeriod;
}
