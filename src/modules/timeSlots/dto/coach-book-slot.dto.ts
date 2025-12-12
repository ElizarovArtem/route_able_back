import { IsUUID } from 'class-validator';
import { BookSlotDto } from './book-slot.dto';

export class CoachBookSlotDto extends BookSlotDto {
  @IsUUID()
  clientId: string;
}
