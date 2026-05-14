import { IsEnum, IsOptional } from 'class-validator';
import {
  SubscriptionPeriod,
  SubscriptionPlanCode,
} from '../../../config/emuns/subscription';

export class ChangeSubscriptionPlanDto {
  @IsEnum(SubscriptionPlanCode)
  planCode: SubscriptionPlanCode;

  @IsOptional()
  @IsEnum(SubscriptionPeriod)
  period?: SubscriptionPeriod;
}
