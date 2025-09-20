import {
  IsISO8601,
  IsOptional,
  IsString,
  Length,
  IsEnum,
} from 'class-validator';

export class CreatePlannedMealDto {
  @IsString()
  @Length(1, 4000)
  text: string;

  @IsISO8601({ strict: true })
  date: string; // 'YYYY-MM-DD'

  @IsOptional()
  @IsEnum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'])
  slot?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
}
