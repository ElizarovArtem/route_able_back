import { IsUUID } from 'class-validator';

export class WsJoinDto {
  @IsUUID()
  chatId: string;
}
