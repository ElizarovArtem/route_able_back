import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
  Put,
  Body,
} from '@nestjs/common';
import { DayService } from './day.service';
// import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request } from 'express';
import { User } from '../../entities/user.entity';

@Controller('days')
// @UseGuards(JwtAuthGuard)
export class DayController {
  constructor(private readonly dayService: DayService) {}

  @Get()
  getAll(@Req() req: Request) {
    const user = req.user as User;
    return this.dayService.getAllDays(user);
  }

  @Get(':date')
  getByDate(@Param('date') date: string, @Req() req: Request) {
    const user = req.user as User;
    return this.dayService.findByDate(user, date);
  }

  @Put(':date/note')
  updateNote(
    @Param('date') date: string,
    @Body('note') note: string,
    @Req() req: Request,
  ) {
    const user = req.user as User;
    return this.dayService.updateNote(user, date, note);
  }
}
