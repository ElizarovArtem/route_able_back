import { IsPhoneNumber, IsString } from 'class-validator';

export class VerifyCodeDto {
  @IsPhoneNumber('RU')
  phone: string;

  @IsString()
  code: string;
}
