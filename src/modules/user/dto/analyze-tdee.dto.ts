import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ActivityLevel, Gender, WeightGoal } from '../../../config/emuns/user';

export class CalcCaloriesDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  weight: number; // кг

  @Type(() => Number)
  @IsNumber()
  @Min(50)
  height: number; // см

  @IsEnum(Gender)
  gender: Gender;

  @IsDateString()
  birthDate: string; // YYYY-MM-DD

  @IsEnum(ActivityLevel)
  activityLevel: ActivityLevel;

  @IsEnum(WeightGoal)
  weightGoal: WeightGoal;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bodyFatPercent?: number; // 0–100
}
