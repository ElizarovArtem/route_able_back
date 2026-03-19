import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateCoachOrderDto } from './dto/create-coach-order.dto';
import { CoachBillingService } from './coachBilling.service';
import { JwtAuthGuard } from '../../libs/guards/auth.guard';

@Controller('coach-orders')
@UseGuards(JwtAuthGuard)
export class CoachOrdersController {
  constructor(private readonly service: CoachBillingService) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateCoachOrderDto) {
    return this.service.createOrder(req.user.id, dto.offerId);
  }

  @Get(':orderId')
  async getOne(@Param('orderId') orderId: string, @Req() req: any) {
    return this.service.getMyOrder(req.user.id, orderId);
  }
}
