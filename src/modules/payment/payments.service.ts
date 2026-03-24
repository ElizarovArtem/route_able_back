import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CoachOrder } from '../../entities/coach-order.entity';
import { PAYMENT_PROVIDER } from '../../config/constants/payments';
import {
  ParsedWebhookEvent,
  PaymentProvider,
} from '../../config/interfaces/payments';
import { CoachBillingService } from '../coachBilling/coachBilling.service';
import {
  CoachOrderStatus,
  CoachPaymentStatus,
  CoachPaymentType,
} from '../../config/emuns/coach-billing';
import { CoachPayment } from '../../entities/coach-payments';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(CoachOrder)
    private readonly orderRepo: Repository<CoachOrder>,

    @Inject(PAYMENT_PROVIDER)
    private readonly paymentProvider: PaymentProvider,

    private readonly coachBillingService: CoachBillingService,
  ) {}

  async createPaymentForOrder(orderId: string) {
    return this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(CoachOrder);
      const paymentRepo = manager.getRepository(CoachPayment);

      const order = await orderRepo.findOne({
        where: { id: orderId },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.status === CoachOrderStatus.PAID) {
        throw new BadRequestException('Order already paid');
      }

      if (
        order.status === CoachOrderStatus.CANCELED ||
        order.status === CoachOrderStatus.REFUNDED ||
        order.status === CoachOrderStatus.FAILED
      ) {
        throw new BadRequestException('Order is not payable');
      }

      const payment = await paymentRepo.findOne({
        where: {
          orderId: order.id,
          type: CoachPaymentType.ORDER_PAYMENT,
        },
      });

      if (!payment) {
        throw new NotFoundException('Order payment record not found');
      }

      if (
        payment.status === CoachPaymentStatus.PENDING &&
        payment.providerExternalId
      ) {
        return {
          orderId: order.id,
          paymentUrl: payment.providerMeta?.paymentUrl ?? null,
          paymentExternalId: payment.providerExternalId,
        };
      }

      const result = await this.paymentProvider.createPayment({
        orderId: order.id,
        amount: Number(order.amount),
        currency: order.currency,
        description: `Оплата заказа ${order.id}`,
        customerId: order.clientId,
      });

      payment.status = CoachPaymentStatus.PENDING;
      payment.provider = 'stub';
      payment.providerExternalId = result.externalPaymentId;
      payment.providerMeta = {
        paymentUrl: result.paymentUrl,
      };

      order.status = CoachOrderStatus.PAYMENT_PENDING;
      order.paymentExternalId = result.externalPaymentId;
      order.paymentProvider = 'stub';

      await paymentRepo.save(payment);
      await orderRepo.save(order);

      return {
        orderId: order.id,
        paymentUrl: result.paymentUrl,
        paymentExternalId: result.externalPaymentId,
      };
    });
  }

  async handleWebhook(payload: unknown, headers?: Record<string, string>) {
    const event = await this.paymentProvider.parseWebhook(payload, headers);

    if (event.objectType === 'COACH_PAYOUT') {
      return this.handlePayoutWebhook(event);
    }

    return this.handleOrderPaymentWebhook(event);
  }

  private async handleOrderPaymentWebhook(event: ParsedWebhookEvent) {
    return this.dataSource.transaction(async (manager) => {
      const paymentRepo = manager.getRepository(CoachPayment);
      const orderRepo = manager.getRepository(CoachOrder);

      const payment = await paymentRepo.findOne({
        where: {
          providerExternalId: event.externalPaymentId,
          type: CoachPaymentType.ORDER_PAYMENT,
        },
        relations: {
          order: true,
        },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      const order = payment.order;

      if (!order) {
        throw new NotFoundException('Order for payment not found');
      }

      if (event.status === 'PAID') {
        if (
          payment.status !== CoachPaymentStatus.SUCCEEDED &&
          payment.status !== CoachPaymentStatus.HOLD
        ) {
          payment.status = CoachPaymentStatus.HOLD;
          payment.heldAt = new Date();
        }

        if (order.status !== CoachOrderStatus.PAID) {
          order.status = CoachOrderStatus.PAID;
          order.paidAt = new Date();
        }

        await paymentRepo.save(payment);
        await orderRepo.save(order);

        await this.coachBillingService.activateOrderAfterPayment(
          order.id,
          manager,
        );

        return { ok: true };
      }

      if (event.status === 'FAILED') {
        payment.status = CoachPaymentStatus.FAILED;
        order.status = CoachOrderStatus.FAILED;

        await paymentRepo.save(payment);
        await orderRepo.save(order);

        return { ok: true };
      }

      if (event.status === 'CANCELED') {
        payment.status = CoachPaymentStatus.CANCELED;
        order.status = CoachOrderStatus.CANCELED;
        order.canceledAt = new Date();

        await paymentRepo.save(payment);
        await orderRepo.save(order);

        return { ok: true };
      }

      if (event.status === 'REFUNDED') {
        payment.status = CoachPaymentStatus.REFUNDED;
        payment.refundedAt = new Date();

        order.status = CoachOrderStatus.REFUNDED;
        order.refundedAt = new Date();

        await paymentRepo.save(payment);
        await orderRepo.save(order);

        return { ok: true };
      }

      return { ok: true };
    });
  }

  private async handlePayoutWebhook(event: ParsedWebhookEvent) {
    return this.dataSource.transaction(async (manager) => {
      const paymentRepo = manager.getRepository(CoachPayment);

      const payment = await paymentRepo.findOne({
        where: {
          providerExternalId: event.externalPaymentId,
          type: CoachPaymentType.COACH_PAYOUT,
        },
      });

      if (!payment) {
        throw new NotFoundException('Payout not found');
      }

      if (event.status === 'PAID') {
        payment.status = CoachPaymentStatus.SUCCEEDED;
        payment.paidOutAt = new Date();
      } else if (event.status === 'FAILED') {
        payment.status = CoachPaymentStatus.FAILED;
        payment.failReason = 'Payout failed via webhook';
      } else if (event.status === 'CANCELED') {
        payment.status = CoachPaymentStatus.CANCELED;
      } else if (event.status === 'REFUNDED') {
        payment.status = CoachPaymentStatus.REFUNDED;
        payment.refundedAt = new Date();
      }

      await paymentRepo.save(payment);

      return { ok: true };
    });
  }
}
