import { IsDateString, IsNotEmpty, IsInt, Min } from 'class-validator';

export class CreateMealDto {
  @IsDateString()
  date: string; // YYYY-MM-DD

  @IsNotEmpty()
  name: string;

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
}
