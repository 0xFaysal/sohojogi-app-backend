import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RequestUser } from '../common/types/request-user.type';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

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
