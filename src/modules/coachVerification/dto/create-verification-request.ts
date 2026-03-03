import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateCoachVerificationRequestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  contactInfo: string;
}
