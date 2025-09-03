import { IsString, Length } from 'class-validator';
export class SendMessageDto {
  @IsString()
  @Length(1, 5000)
  text: string;
}
