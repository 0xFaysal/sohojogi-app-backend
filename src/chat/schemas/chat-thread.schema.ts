import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChatThreadDocument = HydratedDocument<ChatThread>;

export enum ChatThreadType {
  Direct = 'direct',
  Group = 'group',
}

@Schema({ timestamps: true })
export class ChatThread {
  @Prop({ enum: ChatThreadType, required: true })
  type: ChatThreadType;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  participants: Types.ObjectId[];

  @Prop({ trim: true })
  title?: string;

  @Prop({ type: Types.ObjectId, ref: 'GroupBuy' })
  groupBuy?: Types.ObjectId;

  @Prop()
  lastMessageAt?: Date;
}

export const ChatThreadSchema = SchemaFactory.createForClass(ChatThread);
