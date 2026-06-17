import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequestUser } from '../common/types/request-user.type';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.Dealer)
  @Get('support/thread')
  getDealerSupportThread(@Req() request: { user: RequestUser }) {
    return this.chatService.getDealerSupportThread(request.user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.Dealer)
  @Post('support/messages')
  sendDealerSupportMessage(
    @Req() request: { user: RequestUser },
    @Body() dto: Pick<SendMessageDto, 'content'>,
  ) {
    return this.chatService.sendDealerSupportMessage(request.user.userId, dto.content);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @Get('support/admin/threads')
  getDealerSupportThreadsForAdmin(@Req() request: { user: RequestUser }) {
    return this.chatService.getDealerSupportThreadsForAdmin(request.user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @Post('support/admin/threads/:threadId/messages')
  sendAdminSupportMessage(
    @Req() request: { user: RequestUser },
    @Param('threadId') threadId: string,
    @Body() dto: Pick<SendMessageDto, 'content'>,
  ) {
    return this.chatService.sendDealerSupportMessage(request.user.userId, dto.content, threadId);
  }

  @Get('threads')
  getThreads(@Req() request: { user: RequestUser }) {
    return this.chatService.getThreadsForUser(request.user.userId);
  }

  @Get('threads/:threadId/messages')
  getMessages(@Req() request: { user: RequestUser }, @Param('threadId') threadId: string) {
    return this.chatService.getMessages(threadId, request.user.userId);
  }

  @Post('threads/:threadId/messages')
  sendThreadMessage(
    @Req() request: { user: RequestUser },
    @Param('threadId') threadId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(request.user.userId, { ...dto, threadId });
  }
}
