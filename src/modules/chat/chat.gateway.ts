import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { WsJoinDto } from './dto/ws-join.dto';
import { WsSendDto } from './dto/ws-send.dto';
import { WsJwtGuard } from '../../libs/guards/ws-jwt.guard';

@WebSocketGateway({
  namespace: '/chats',
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || [],
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  private room(chatId: string) {
    return `chat:${chatId}`;
  }

  @SubscribeMessage('join_chat')
  async join(@ConnectedSocket() client: Socket, @MessageBody() dto: WsJoinDto) {
    const userId = client.data.user.id;

    await this.chatService.assertParticipant(userId, dto.chatId);

    await client.join(this.room(dto.chatId));
    return { ok: true };
  }

  @SubscribeMessage('leave_chat')
  async leave(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: WsJoinDto,
  ) {
    await client.leave(this.room(dto.chatId));
    return { ok: true };
  }

  @SubscribeMessage('send_message')
  async send(@ConnectedSocket() client: Socket, @MessageBody() dto: WsSendDto) {
    const userId = client.data.user.id;

    const msg = await this.chatService.sendMessage(
      userId,
      dto.chatId,
      dto.text,
    );

    // всем в комнате
    this.server.to(this.room(dto.chatId)).emit('new_message', msg);

    // можно вернуть ack отправителю (socket.io сам вернёт response как ack)
    return { ok: true, message: msg };
  }
}
