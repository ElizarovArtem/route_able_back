import {
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePlannedExerciseDto {
  @IsISO8601({ strict: true })
  date: string; // 'YYYY-MM-DD'

  @IsString()
  @Length(1, 200)
  name: string;

  @IsInt()
  @Type(() => Number)
  @Min(1)
  sets: number;

  @IsInt()
  @Type(() => Number)
  @Min(1)
  reps: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  workingWeight: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number; // если не передали — поставим в конец списка на этот день

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
