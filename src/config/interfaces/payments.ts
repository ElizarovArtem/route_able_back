export type ExternalPaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELED'
  | 'REFUNDED';

export interface CreateExternalPaymentInput {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  customerId?: string;
  successUrl?: string;
  failUrl?: string;
}

export interface CreateExternalPaymentResult {
  externalPaymentId: string;
  paymentUrl?: string;
  raw?: unknown;
}

export interface ParsedWebhookEvent {
  externalPaymentId: string;
  status: ExternalPaymentStatus;
  raw?: unknown;
  objectType?: 'ORDER_PAYMENT' | 'COACH_PAYOUT';
}

export interface PaymentProvider {
  createPayment(
    input: CreateExternalPaymentInput,
  ): Promise<CreateExternalPaymentResult>;
  parseWebhook(
    payload: unknown,
    headers?: Record<string, string>,
  ): Promise<ParsedWebhookEvent>;
  createCoachPayout(
    input: CreateCoachPayoutInput,
  ): Promise<CreateCoachPayoutResult>;
}

export interface CreateCoachPayoutInput {
  coachId: string;
  clientId: string;
  orderId: string;
  sessionId: string;
  amount: number;
  currency: string;
}

export interface CreateCoachPayoutResult {
  externalPayoutId: string;
  provider?: string;
  raw?: unknown;
}
