import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TimeSlotsService } from './timeSlots.service';
import { CreateSlotDto } from './dto/create-slot.dto';
import { DayQueryDto } from './dto/day-query.dto';
import { CoachBookSlotDto } from './dto/coach-book-slot.dto';
import { Roles } from '../../config/emuns/user';
import { JwtAuthGuard } from '../../libs/guards/auth.guard';
import { RolesDecorator } from '../../config/decorators/roles.decorator';
import { CurrentUser } from '../../config/decorators/current-user.decorator';
import { RolesGuard } from '../../libs/guards/roles.guard';

@Controller('coach/slots')
@UseGuards(JwtAuthGuard, RolesGuard)
@RolesDecorator(Roles.Coach)
export class CoachTimeSlotsController {
  constructor(private readonly timeSlotsService: TimeSlotsService) {}

  @Post()
  createSlot(@CurrentUser('id') coachId: string, @Body() dto: CreateSlotDto) {
    return this.timeSlotsService.createSlotForCoach(coachId, dto);
  }

  @Delete(':id')
  deleteSlot(@CurrentUser('id') coachId: string, @Param('id') slotId: string) {
    return this.timeSlotsService.deleteSlotForCoach(coachId, slotId);
  }

  @Get()
  getSlotsByDay(
    @CurrentUser('id') coachId: string,
    @Query() query: DayQueryDto,
  ) {
    return this.timeSlotsService.getSlotsForCoachByDay(coachId, query);
  }

  @Post(':id/book')
  bookClientOnSlot(
    @CurrentUser('id') coachId: string,
    @Param('id') slotId: string,
    @Body() dto: CoachBookSlotDto,
  ) {
    return this.timeSlotsService.coachBookSlotForClient(coachId, slotId, dto);
  }
}
