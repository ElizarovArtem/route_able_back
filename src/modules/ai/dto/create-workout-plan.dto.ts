import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateWorkoutPlanDto {
  @IsString()
  @IsOptional()
  intent?: string; // "Хочу сегодня сделать акцент на спину и пресс"

  @IsInt()
  @Min(1)
  @Max(10)
  energyLevel: number;

  @IsInt()
  @Min(1)
  @Max(10)
  sleepQuality: number;

  @IsInt()
  @Min(1)
  @Max(10)
  nutritionQuality: number;
}
