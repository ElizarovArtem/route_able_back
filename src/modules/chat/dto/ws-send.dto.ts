import { IsString, IsUUID, MinLength } from 'class-validator';

export class WsSendDto {
  @IsUUID()
  chatId: string;

  @IsString()
  @MinLength(1)
  text: string;
}
