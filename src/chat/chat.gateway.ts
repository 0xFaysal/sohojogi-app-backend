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
import { Role } from '../common/enums/role.enum';
import { RequestUser } from '../common/types/request-user.type';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

type AuthenticatedSocket = Socket & { user?: RequestUser; visitorId?: string };

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
    const visitorId = client.handshake.auth?.visitorId;
    if (typeof visitorId === 'string' && visitorId.trim()) {
      client.visitorId = visitorId.trim();
      client.join(this.visitorRoom(client.visitorId));
      return;
    }

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
      if (client.user.roles?.includes(Role.Admin)) {
        client.join('support:admins');
      }
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

  @SubscribeMessage('support:message')
  async handleSupportMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { threadId?: string; content: string },
  ) {
    if (!client.user) {
      client.disconnect(true);
      return;
    }

    const message = await this.chatService.sendDealerSupportMessage(
      client.user.userId,
      payload.content,
      payload.threadId,
    );
    const thread = await this.chatService.getThread(message.threadId.toString());
    const room = this.threadRoom(thread.id);
    client.join(room);

    for (const participant of thread.participants) {
      this.server.to(this.userRoom(participant.toString())).emit('support:message', message);
    }

    this.server.to(room).emit('support:message', message);
    return message;
  }

  @SubscribeMessage('support:publicMessage')
  async handlePublicSupportMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    payload: {
      conversationId?: string;
      visitorId?: string;
      visitorName?: string;
      visitorEmail?: string;
      visitorPhone?: string;
      content: string;
    },
  ) {
    if (client.user) {
      if (!payload.conversationId) {
        return;
      }

      const message = await this.chatService.sendPublicSupportAdminReply(
        client.user.userId,
        payload.conversationId,
        payload.content,
      );
      this.server
        .to(this.publicSupportRoom(payload.conversationId))
        .emit('support:publicMessage', message);
      this.server.to('support:admins').emit('support:publicMessage', message);
      return message;
    }

    const visitorId = client.visitorId ?? payload.visitorId;
    if (!visitorId) {
      client.disconnect(true);
      return;
    }

    const message = await this.chatService.sendPublicSupportMessage({
      visitorId,
      visitorName: payload.visitorName,
      visitorEmail: payload.visitorEmail,
      visitorPhone: payload.visitorPhone,
      content: payload.content,
    });
    client.join(this.publicSupportRoom(message.conversation.toString()));
    this.server
      .to(this.publicSupportRoom(message.conversation.toString()))
      .emit('support:publicMessage', message);
    this.server.to('support:admins').emit('support:publicMessage', message);
    return message;
  }

  @SubscribeMessage('support:joinPublicConversation')
  async handleJoinPublicConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { conversationId: string },
  ) {
    if (client.user) {
      client.join('support:admins');
    }

    client.join(this.publicSupportRoom(payload.conversationId));
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

  private visitorRoom(visitorId: string) {
    return `visitor:${visitorId}`;
  }

  private publicSupportRoom(conversationId: string) {
    return `support:public:${conversationId}`;
  }
}
