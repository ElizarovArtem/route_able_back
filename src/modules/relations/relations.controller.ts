import { Controller, Patch, Param, UseGuards, Req, Get } from '@nestjs/common';
import { RelationsService } from './relations.service';
import { JwtAuthGuard } from '../../libs/guards/auth.guard';

@Controller('relations')
@UseGuards(JwtAuthGuard)
export class RelationsController {
  constructor(private readonly svc: RelationsService) {}

  @Get('with/:partnerId')
  getWithPartner(@Req() req, @Param('partnerId') partnerId: string) {
    return this.svc.getViewWithPartner(req.user.id, partnerId);
  }

  @Patch(':id/activate')
  activate(@Req() req, @Param('id') id: string) {
    // 🚩 сейчас это «мок оплаты»: клиент/тренер могут включить вручную.
    // В будущем сюда будет бить платежный вебхук.
    return this.svc.activateLink(id, req.user.id);
  }

  @Patch(':id/deactivate')
  deactivate(@Req() req, @Param('id') id: string) {
    return this.svc.deactivateLink(id, req.user.id);
  }
}
