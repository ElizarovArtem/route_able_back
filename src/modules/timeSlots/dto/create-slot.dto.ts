import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSlotDto {
  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;

  // Если НЕ указано → слот публичный
  @IsUUID()
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsOptional()
  note?: string;
}
