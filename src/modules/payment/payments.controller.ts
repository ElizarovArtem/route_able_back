import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../libs/guards/auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('orders/:orderId/create')
  @UseGuards(JwtAuthGuard)
  async createPayment(@Param('orderId') orderId: string) {
    return this.paymentsService.createPaymentForOrder(orderId);
  }

  @Post('webhook')
  async webhook(@Body() body: any) {
    return this.paymentsService.handleWebhook(body);
  }
}
