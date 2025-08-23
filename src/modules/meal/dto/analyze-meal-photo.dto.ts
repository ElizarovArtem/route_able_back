import { IsNumberString } from 'class-validator';

export class AnalyzeMealPhotoDto {
  @IsNumberString()
  weight: string;
}
