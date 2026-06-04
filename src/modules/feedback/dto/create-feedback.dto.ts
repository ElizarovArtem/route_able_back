import { IsEnum, IsString, Length, MaxLength } from 'class-validator';
import { FeedbackType } from '../../../config/emuns/feedback';

export class CreateFeedbackDto {
  @IsEnum(FeedbackType)
  type: FeedbackType;

  @IsString()
  @Length(5, 3000)
  message: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @MaxLength(255)
  contact: string;
}
