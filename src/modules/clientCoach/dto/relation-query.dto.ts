import { IsDateString, IsOptional } from 'class-validator';

export class RelationQueryDto {
  @IsDateString()
  @IsOptional()
  date?: string;
}
