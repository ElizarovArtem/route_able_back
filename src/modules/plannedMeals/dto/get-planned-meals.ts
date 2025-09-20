import { IsISO8601 } from 'class-validator';

export class PlannedMealsListDto {
  @IsISO8601({ strict: true })
  date: string;
}
