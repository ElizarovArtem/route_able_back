import {
  Controller,
  Patch,
  Param,
  UseGuards,
  Req,
  Get,
  Body,
} from '@nestjs/common';
import { ClientCoachService } from './clientCoach.service';
import { JwtAuthGuard } from '../../libs/guards/auth.guard';
import { UpsertGoalsDto } from './dto/set-goals.dto';

@Controller('client-coach')
@UseGuards(JwtAuthGuard)
export class ClientCoachController {
  constructor(private readonly relationsService: ClientCoachService) {}

  @Get('with/:partnerId')
  getWithPartner(@Req() req, @Param('partnerId') partnerId: string) {
    return this.relationsService.getViewWithPartner(req.user.id, partnerId);
  }

  @Get('my')
  myInteractions(@Req() req) {
    return this.relationsService.getMyInteractions(req.user.id);
  }

  @Patch(':id/activate')
  activate(@Req() req, @Param('id') id: string) {
    // 🚩 сейчас это «мок оплаты»: клиент/тренер могут включить вручную.
    // В будущем сюда будет бить платежный вебхук.
    return this.relationsService.activateLink(id, req.user.id);
  }

  @Patch(':id/deactivate')
  deactivate(@Req() req, @Param('id') id: string) {
    return this.relationsService.deactivateLink(id, req.user.id);
  }

  @Get(':relationId/nutrition-goals')
  getGoals(@Req() req, @Param('relationId') relationId: string) {
    return this.relationsService.getGoals(req.user.id, relationId);
  }

  @Patch(':relationId/nutrition-goals')
  upsertGoals(
    @Req() req,
    @Param('relationId') relationId: string,
    @Body() dto: UpsertGoalsDto,
  ) {
    return this.relationsService.upsertGoals(req.user.id, relationId, dto);
  }
}
