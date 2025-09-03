import { IsUUID } from 'class-validator';
export class StartChatDto {
  @IsUUID()
  otherUserId: string; // должен быть Coach
}
