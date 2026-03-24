import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelCoachWorkoutSessionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
