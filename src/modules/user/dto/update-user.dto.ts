import {
  IsOptional,
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsBoolean,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsBoolean()
  isCoach?: boolean;

  @IsOptional()
  @IsString()
  about?: string;
}
