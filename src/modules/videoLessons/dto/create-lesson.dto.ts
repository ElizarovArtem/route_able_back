import { IsISO8601, IsOptional, IsString } from 'class-validator';

export class CreateLessonDto {
  @IsISO8601()
  startAt!: string;

  @IsISO8601()
  endAt!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
