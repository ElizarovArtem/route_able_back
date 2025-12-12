import { IsDateString } from 'class-validator';

export class DayQueryDto {
  // дата в формате YYYY-MM-DD (будем искать все слоты, у которых startAt в этот день)
  @IsDateString()
  date: string;
}
