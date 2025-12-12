import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DayQueryDto } from './dto/day-query.dto';
import { BookSlotDto } from './dto/book-slot.dto';
import { Roles } from '../../config/emuns/user';
import { TimeSlotsService } from './timeSlots.service';
import { JwtAuthGuard } from '../../libs/guards/auth.guard';
import { RolesGuard } from '../../libs/guards/roles.guard';
import { RolesDecorator } from '../../config/decorators/roles.decorator';
import { CurrentUser } from '../../config/decorators/current-user.decorator';

@Controller()
export class TimeSlotsController {
  constructor(private readonly timeSlotsService: TimeSlotsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(Roles.Client)
  @Get('coaches/:coachId/slots')
  getCoachSlotsByDay(
    @CurrentUser('id') clientId: string,
    @Param('coachId') coachId: string,
    @Query() query: DayQueryDto,
  ) {
    return this.timeSlotsService.getSlotsForClientByDay(
      clientId,
      coachId,
      query,
    );
  }

  // клиент записывается на слот
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(Roles.Client)
  @Post('slots/:id/book')
  bookSlot(
    @CurrentUser('id') clientId: string,
    @Param('id') slotId: string,
    @Body() dto: BookSlotDto,
  ) {
    return this.timeSlotsService.clientBookSlot(clientId, slotId, dto);
  }
}
