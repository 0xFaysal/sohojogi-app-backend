import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { RequestUser } from '../common/types/request-user.type';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

type AuthenticatedSocket = Socket & { user?: RequestUser };

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = this.extractToken(client);
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      client.user = {
        userId: payload.sub,
        email: payload.email,
        roles: payload.roles,
      };
      client.join(this.userRoom(client.user.userId));
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: SendMessageDto,
  ) {
    if (!client.user) {
      client.disconnect(true);
      return;
    }

    const message = await this.chatService.sendMessage(client.user.userId, dto);
    const thread = await this.chatService.getThread(message.threadId.toString());
    const room = this.threadRoom(thread.id);
    client.join(room);

    for (const participant of thread.participants) {
      this.server.to(this.userRoom(participant.toString())).emit('message', message);
    }

    this.server.to(room).emit('message', message);
    return message;
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { threadId: string; isTyping: boolean },
  ) {
    if (!client.user) {
      client.disconnect(true);
      return;
    }

    await this.chatService.getMessages(payload.threadId, client.user.userId);
    client.to(this.threadRoom(payload.threadId)).emit('typing', {
      threadId: payload.threadId,
      userId: client.user.userId,
      isTyping: payload.isTyping,
    });
  }

  @SubscribeMessage('readReceipt')
  async handleReadReceipt(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { threadId: string },
  ) {
    if (!client.user) {
      client.disconnect(true);
      return;
    }

    const receipt = await this.chatService.markRead(payload.threadId, client.user.userId);
    this.server.to(this.threadRoom(payload.threadId)).emit('readReceipt', receipt);
    return receipt;
  }

  private extractToken(client: Socket): string {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string') {
      return authToken;
    }

    const header = client.handshake.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      return header.slice(7);
    }

    throw new Error('Missing token');
  }

  private userRoom(userId: string) {
    return `user:${userId}`;
  }

  private threadRoom(threadId: string) {
    return `thread:${threadId}`;
  }
}
