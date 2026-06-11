import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ChatThreadType } from './chat-thread.schema';

export type ChatMessageDocument = HydratedDocument<ChatMessage>;

@Schema({ timestamps: true })
export class ChatMessage {
  @Prop({ type: Types.ObjectId, ref: 'ChatThread', required: true })
  threadId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  receiver?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'GroupBuy' })
  groupId?: Types.ObjectId;

  @Prop({ enum: ChatThreadType, required: true })
  type: ChatThreadType;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  readBy: Types.ObjectId[];
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
