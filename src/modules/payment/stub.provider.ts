import {
  CreateCoachPayoutInput,
  CreateCoachPayoutResult,
  CreateExternalPaymentInput,
  CreateExternalPaymentResult,
  ParsedWebhookEvent,
  PaymentProvider,
} from '../../config/interfaces/payments';

export class StubPaymentProvider implements PaymentProvider {
  async createPayment(
    input: CreateExternalPaymentInput,
  ): Promise<CreateExternalPaymentResult> {
    return {
      externalPaymentId: `stub_${input.orderId}`,
      paymentUrl: `https://example.com/pay/${input.orderId}`,
      raw: input,
    };
  }

  async parseWebhook(payload: any): Promise<ParsedWebhookEvent> {
    return {
      externalPaymentId: payload.externalPaymentId,
      status: payload.status,
      raw: payload,
      objectType: payload.objectType ?? 'ORDER_PAYMENT',
    };
  }

  async createCoachPayout(
    input: CreateCoachPayoutInput,
  ): Promise<CreateCoachPayoutResult> {
    return {
      externalPayoutId: `payout_stub_${input.sessionId}`,
      provider: 'stub',
      raw: input,
    };
  }
}
