import { IsDateString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateMealDto {
  @IsDateString()
  date: string; // YYYY-MM-DD

  @IsNotEmpty()
  name: string;

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
}
