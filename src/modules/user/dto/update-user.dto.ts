import {
  IsOptional,
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsNumberString,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumberString()
  height?: string;

  @IsOptional()
  @IsString()
  weight?: string;

  @IsOptional()
  @IsNumberString()
  @IsPhoneNumber('RU')
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  isCoach?: string;

  @IsOptional()
  @IsString()
  about?: string;
}
