import { IsDateString, IsEnum, IsNotEmpty, IsInt, Min } from 'class-validator';
import { MealType } from '../../../config/emuns/meal';

export class CreateMealDto {
  @IsDateString()
  date: string; // YYYY-MM-DD

  @IsEnum(MealType)
  mealType: MealType;

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
