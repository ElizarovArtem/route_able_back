import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { FeedbackStatus, FeedbackType } from '../../../config/emuns/feedback';
import { Type } from 'class-transformer';

export class ListFeedbackQueryDto {
  @IsOptional()
  @IsEnum(FeedbackType)
  type?: FeedbackType;

  @IsOptional()
  @IsEnum(FeedbackStatus)
  status?: FeedbackStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number = 20;
}
