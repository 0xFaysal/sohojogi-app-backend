import { IsEnum, IsMongoId, IsOptional, IsString, MinLength } from 'class-validator';
import { ChatThreadType } from '../schemas/chat-thread.schema';

export class SendMessageDto {
  @IsEnum(ChatThreadType)
  type: ChatThreadType;

  @IsOptional()
  @IsMongoId()
  threadId?: string;

  @IsOptional()
  @IsMongoId()
  receiverId?: string;

  @IsOptional()
  @IsMongoId()
  groupId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  @MinLength(1)
  content: string;
}
