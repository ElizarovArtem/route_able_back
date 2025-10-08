import {
  IsISO8601,
  IsOptional,
  IsString,
  Length,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';

export class CreatePlannedMealDto {
  @IsString()
  @Length(1, 4000)
  text: string;

  @IsInt()
  @Min(0)
  calories: number;

  @IsInt()
  @Min(0)
  protein: number;

  @IsInt()
  @Min(0)
  fat: number;

  @IsInt()
  @Min(0)
  carbs: number;

  @IsISO8601({ strict: true })
  date: string; // 'YYYY-MM-DD'

  @IsOptional()
  @IsEnum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'])
  slot?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
}
