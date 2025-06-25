import { IsPhoneNumber } from 'class-validator';

export class RequestCodeDto {
  @IsPhoneNumber('RU')
  phone: string;
}
