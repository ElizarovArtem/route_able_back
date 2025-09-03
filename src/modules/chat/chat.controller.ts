import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { StartChatDto } from './dto/start-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../../libs/guards/auth.guard';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('start')
  start(@Req() req, @Body() dto: StartChatDto) {
    return this.chatService.startChat(req.user.id, dto.otherUserId);
  }

  @Get()
  my(@Req() req) {
    return this.chatService.getMyChats(req.user.id);
  }

  @Get(':chatId/messages')
  messages(
    @Req() req,
    @Param('chatId') chatId: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.chatService.getMessages(
      req.user.id,
      chatId,
      limit ? Number(limit) : 50,
      cursor,
    );
  }

  @Post(':chatId/messages')
  send(
    @Req() req,
    @Param('chatId') chatId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(req.user.id, chatId, dto.text);
  }
}
