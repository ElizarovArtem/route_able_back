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
  height?: number;

  @IsOptional()
  @IsString()
  @IsNumberString()
  weight?: number;

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
