import {
  IsOptional,
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsNumber,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ActivityLevel, WeightGoal } from '../../../config/emuns/user';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  height?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  weight?: number;

  @IsOptional()
  @ValidateIf((o) => o.phone !== '' && o.phone != null)
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

  @IsEnum(ActivityLevel)
  activityLevel: ActivityLevel;

  @IsEnum(WeightGoal)
  weightGoal: WeightGoal;
}
