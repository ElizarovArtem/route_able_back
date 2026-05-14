import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../libs/guards/auth.guard';
import { CurrentUser } from '../../config/decorators/current-user.decorator';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionCheckoutDto } from './dto/create-subscription-checkout.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { ChangeSubscriptionPlanDto } from './dto/change-subscription-plan.dto';
import { Public } from '../../config/decorators/public.decorator';
import { SubscriptionWebhookDto } from './dto/subscription-webhook.dto';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  getPlans() {
    return this.subscriptionsService.getActivePlans();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMySubscription(@CurrentUser('id') userId: string) {
    return this.subscriptionsService.getMySubscription(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('payments/:paymentId/status')
  getPaymentStatus(
    @CurrentUser('id') userId: string,
    @Param('paymentId') paymentId: string,
  ) {
    return this.subscriptionsService.getPaymentStatus(userId, paymentId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  createCheckout(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSubscriptionCheckoutDto,
  ) {
    return this.subscriptionsService.createCheckout(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('cancel')
  cancel(
    @CurrentUser('id') userId: string,
    @Body() dto: CancelSubscriptionDto,
  ) {
    return this.subscriptionsService.cancelSubscription(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-plan')
  changePlan(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangeSubscriptionPlanDto,
  ) {
    return this.subscriptionsService.changePlan(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('stub/activate')
  activateStub(
    @CurrentUser('id') userId: string,
    @Body() body: { subscriptionId?: string; paymentId?: string },
  ) {
    return this.subscriptionsService.activateStubSubscription(userId, body);
  }

  @Public()
  @Post('webhook')
  handleWebhook(
    @Body() body: SubscriptionWebhookDto,
    @Headers() headers: Record<string, string>,
  ) {
    return this.subscriptionsService.handleWebhook(body, headers);
  }
}
