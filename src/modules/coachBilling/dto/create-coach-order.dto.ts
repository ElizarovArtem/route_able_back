import { IsUUID } from 'class-validator';

export class CreateCoachOrderDto {
  @IsUUID()
  offerId: string;
}
