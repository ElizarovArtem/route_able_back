import { IsPhoneNumber, IsString, ValidateIf, IsEmail } from 'class-validator';

export class VerifyCodeDto {
  @ValidateIf((o) => !o.email)
  @IsPhoneNumber('RU', { message: 'Некорректный номер телефона' })
  phone?: string;

  @ValidateIf((o) => !o.phone)
  @IsEmail()
  email?: string;

  @IsString()
  code: string;
}
