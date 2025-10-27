import {
  IsISO8601,
  IsOptional,
  IsString,
  Length,
  IsEnum,
  IsNumber,
  Min,
} from 'class-validator';

export class CreatePlannedMealDto {
  @IsString()
  @Length(1, 4000)
  text: string;

  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'calories must be a number' },
  )
  @Min(0)
  calories: number;

  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'protein must be a number' },
  )
  @Min(0)
  protein: number;

  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'fat must be a number' },
  )
  @Min(0)
  fat: number;

  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'carbs must be a number' },
  )
  @Min(0)
  carbs: number;

  @IsISO8601({ strict: true })
  date: string; // 'YYYY-MM-DD'

  @IsOptional()
  @IsEnum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'])
  slot?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
}
