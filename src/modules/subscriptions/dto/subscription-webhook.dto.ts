import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class SubscriptionWebhookDto {
  @IsString()
  externalPaymentId: string;

  @IsIn(['PENDING', 'PAID', 'FAILED', 'CANCELED', 'REFUNDED'])
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELED' | 'REFUNDED';

  @IsOptional()
  @IsString()
  externalInvoiceId?: string;

  @IsOptional()
  @IsObject()
  raw?: Record<string, any>;
}
