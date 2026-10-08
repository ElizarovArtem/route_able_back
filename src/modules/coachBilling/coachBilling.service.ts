import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CoachOffer } from '../../entities/coach-offer.entity';
import { CoachOrder } from 'src/entities/coach-order.entity';
import { ClientCoach } from 'src/entities/client-coach.entity';
import { ClientCoachTransaction } from '../../entities/client-coach-transaction.entity';
import { User } from 'src/entities/user.entity';
import { Roles } from 'src/config/emuns/user';
import {
  ClientCoachTransactionType,
  CoachOrderStatus,
  CoachPaymentStatus,
  CoachPaymentType,
} from '../../config/emuns/coach-billing';
import { CoachPayment } from '../../entities/coach-payments';
import { SessionBalanceService } from './session-balance.service';

@Injectable()
export class CoachBillingService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly sessionBalance: SessionBalanceService,

    @InjectRepository(CoachOffer)
    private readonly offerRepo: Repository<CoachOffer>,

    @InjectRepository(CoachOrder)
    private readonly orderRepo: Repository<CoachOrder>,

    @InjectRepository(ClientCoach)
    private readonly clientCoachRepo: Repository<ClientCoach>,

    @InjectRepository(ClientCoachTransaction)
    private readonly transactionRepo: Repository<ClientCoachTransaction>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async createOrder(clientId: string, offerId: string) {
    return this.dataSource.transaction(async (manager) => {
      const offerRepo = manager.getRepository(CoachOffer);
      const userRepo = manager.getRepository(User);
      const clientCoachRepo = manager.getRepository(ClientCoach);
      const orderRepo = manager.getRepository(CoachOrder);
      const paymentRepo = manager.getRepository(CoachPayment);

      const offer = await offerRepo.findOne({
        where: { id: offerId, isActive: true },
      });

      if (!offer) {
        throw new NotFoundException('Offer not found');
      }

      if (offer.coachId === clientId) {
        throw new BadRequestException('Нельзя купить свою же услугу');
      }

      const coach = await userRepo.findOne({
        where: { id: offer.coachId },
      });

      if (!coach || !coach.roles?.includes(Roles.Coach)) {
        throw new BadRequestException('Coach not found');
      }

      let clientCoach = await clientCoachRepo.findOne({
        where: {
          clientId,
          coachId: offer.coachId,
        },
      });

      if (!clientCoach) {
        clientCoach = clientCoachRepo.create({
          clientId,
          coachId: offer.coachId,
        });

        await clientCoachRepo.save(clientCoach);
      }

      const existingOrder = await orderRepo.findOne({
        where: {
          clientCoachId: clientCoach.id,
          offerId: offer.id,
          status: In([
            CoachOrderStatus.CREATED,
            CoachOrderStatus.PAYMENT_PENDING,
          ]),
        },
        order: { createdAt: 'DESC' },
      });

      if (existingOrder) {
        return { orderId: existingOrder.id };
      }

      const order = orderRepo.create({
        clientCoachId: clientCoach.id,
        clientId,
        coachId: offer.coachId,
        offerId: offer.id,
        status: CoachOrderStatus.CREATED,
        sessionCount: offer.sessionCount,
        amount: offer.price,
        currency: offer.currency,
        sessionsUsed: 0,
        sessionsReserved: 0,
      });

      await orderRepo.save(order);

      const payment = paymentRepo.create({
        clientCoachId: clientCoach.id,
        orderId: order.id,
        clientId,
        coachId: offer.coachId,
        type: CoachPaymentType.ORDER_PAYMENT,
        status: CoachPaymentStatus.CREATED,
        amount: order.amount,
        platformFee: 0,
        coachAmount: 0,
        currency: order.currency,
      });

      await paymentRepo.save(payment);

      return {
        orderId: order.id,
      };
    });
  }

  async activateOrderAfterPayment(orderId: string, manager?: EntityManager) {
    const run = async (tx: EntityManager) => {
      const orderRepo = tx.getRepository(CoachOrder);
      const clientCoachRepo = tx.getRepository(ClientCoach);
      const transactionRepo = tx.getRepository(ClientCoachTransaction);

      // порядок блокировок везде: слот → пара → заказ. Блокировка пары сериализует
      // параллельные активации (вебхук + возврат с оплаты) и бронирования.
      const probe = await orderRepo.findOne({ where: { id: orderId } });

      if (!probe) {
        throw new NotFoundException('Order not found');
      }

      await clientCoachRepo.findOne({
        where: { id: probe.clientCoachId },
        lock: { mode: 'pessimistic_write' },
      });

      const order = await orderRepo.findOne({
        where: { id: orderId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      const existingCredit = await transactionRepo.findOne({
        where: {
          orderId: order.id,
          type: ClientCoachTransactionType.PURCHASE_CREDIT,
        },
      });

      if (existingCredit) {
        const relation = await clientCoachRepo.findOne({
          where: { id: order.clientCoachId },
        });

        return {
          orderId: order.id,
          status: order.status,
          relationId: relation?.id ?? order.clientCoachId,
          sessionsRemaining: relation?.sessionsRemaining ?? 0,
        };
      }

      if (
        order.status !== CoachOrderStatus.PAID &&
        order.status !== CoachOrderStatus.PAYMENT_PENDING &&
        order.status !== CoachOrderStatus.CREATED
      ) {
        throw new BadRequestException(
          'Order cannot be activated after payment',
        );
      }

      if (order.status !== CoachOrderStatus.PAID) {
        order.status = CoachOrderStatus.PAID;
        order.paidAt = order.paidAt ?? new Date();
        await orderRepo.save(order);
      }

      const relation = await this.sessionBalance.credit(
        tx,
        order.clientCoachId,
        order,
        `Начисление по заказу ${order.id}`,
      );

      return {
        orderId: order.id,
        status: order.status,
        relationId: relation.id,
        sessionsRemaining: relation.sessionsRemaining,
      };
    };

    if (manager) {
      return run(manager);
    }

    return this.dataSource.transaction(run);
  }

  async getMyOrder(clientId: string, orderId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, clientId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
}
