import { IsDateString, IsOptional } from 'class-validator';

export class CoachLessonsQueryDto {
  // если передан ?date=YYYY-MM-DD — вернём уроки за этот день
  @IsDateString()
  @IsOptional()
  date?: string;
}
