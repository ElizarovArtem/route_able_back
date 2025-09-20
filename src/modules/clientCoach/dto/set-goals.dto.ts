import { IsInt, IsOptional, Min } from 'class-validator';

export class UpsertGoalsDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  goalCalories?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  goalProtein?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  goalFat?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  goalCarbs?: number;
}
