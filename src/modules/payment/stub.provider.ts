import {
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
    };
  }
}
