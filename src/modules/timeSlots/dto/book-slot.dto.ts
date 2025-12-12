import { IsOptional, IsString } from 'class-validator';

export class BookSlotDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
