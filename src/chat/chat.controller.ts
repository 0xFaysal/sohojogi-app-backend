import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequestUser } from '../common/types/request-user.type';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('public-support/conversations')
  getPublicSupportConversation(
    @Body()
    dto: {
      visitorId: string;
      visitorName?: string;
      visitorEmail?: string;
      visitorPhone?: string;
    },
  ) {
    return this.chatService.getPublicSupportConversation(dto);
  }

  @Get('public-support/conversations/:conversationId/messages/:visitorId')
  getPublicSupportMessages(
    @Param('conversationId') conversationId: string,
    @Param('visitorId') visitorId: string,
  ) {
    return this.chatService.getPublicSupportMessages(conversationId, visitorId);
  }

  @Post('public-support/messages')
  sendPublicSupportMessage(
    @Body()
    dto: {
      visitorId: string;
      content: string;
      visitorName?: string;
      visitorEmail?: string;
      visitorPhone?: string;
    },
  ) {
    return this.chatService.sendPublicSupportMessage(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Dealer)
  @Get('support/thread')
  getDealerSupportThread(@Req() request: { user: RequestUser }) {
    return this.chatService.getDealerSupportThread(request.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Dealer)
  @Post('support/messages')
  sendDealerSupportMessage(
    @Req() request: { user: RequestUser },
    @Body() dto: Pick<SendMessageDto, 'content'>,
  ) {
    return this.chatService.sendDealerSupportMessage(request.user.userId, dto.content);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Get('support/admin/threads')
  getDealerSupportThreadsForAdmin(@Req() request: { user: RequestUser }) {
    return this.chatService.getPublicSupportThreadsForAdmin(request.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Get('support/admin/threads/:threadId/messages')
  getAdminSupportMessages(
    @Req() request: { user: RequestUser },
    @Param('threadId') threadId: string,
  ) {
    return this.chatService.getPublicSupportMessagesForAdmin(request.user.userId, threadId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Post('support/admin/threads/:threadId/messages')
  sendAdminSupportMessage(
    @Req() request: { user: RequestUser },
    @Param('threadId') threadId: string,
    @Body() dto: Pick<SendMessageDto, 'content'>,
  ) {
    return this.chatService.sendPublicSupportAdminReply(request.user.userId, threadId, dto.content);
  }

  @UseGuards(JwtAuthGuard)
  @Get('threads')
  getThreads(@Req() request: { user: RequestUser }) {
    return this.chatService.getThreadsForUser(request.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('threads/:threadId/messages')
  getMessages(@Req() request: { user: RequestUser }, @Param('threadId') threadId: string) {
    return this.chatService.getMessages(threadId, request.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('threads/:threadId/messages')
  sendThreadMessage(
    @Req() request: { user: RequestUser },
    @Param('threadId') threadId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(request.user.userId, { ...dto, threadId });
  }
}
