import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SupportMessageDocument = HydratedDocument<SupportMessage>;

@Schema({ timestamps: true })
export class SupportMessage {
  @Prop({ type: Types.ObjectId, ref: 'SupportConversation', required: true })
  conversation: Types.ObjectId;

  @Prop({ required: true, enum: ['visitor', 'admin'] })
  senderType: 'visitor' | 'admin';

  @Prop({ type: Types.ObjectId, ref: 'User' })
  admin?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ default: false })
  readByAdmin: boolean;

  @Prop({ default: false })
  readByVisitor: boolean;
}

export const SupportMessageSchema = SchemaFactory.createForClass(SupportMessage);
