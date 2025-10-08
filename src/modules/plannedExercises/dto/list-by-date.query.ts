import { IsISO8601, IsOptional, IsInt, Min } from 'class-validator';

export class ListByDateQuery {
  @IsISO8601({ strict: true })
  date: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
