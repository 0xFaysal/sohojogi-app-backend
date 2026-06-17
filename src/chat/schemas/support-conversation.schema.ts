import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SupportConversationDocument = HydratedDocument<SupportConversation>;

@Schema({ timestamps: true })
export class SupportConversation {
  @Prop({ required: true, unique: true, trim: true })
  visitorId: string;

  @Prop({ trim: true })
  visitorName?: string;

  @Prop({ trim: true, lowercase: true })
  visitorEmail?: string;

  @Prop({ trim: true })
  visitorPhone?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedAdmin?: Types.ObjectId;

  @Prop({ default: 'open', enum: ['open', 'closed'] })
  status: 'open' | 'closed';

  @Prop()
  lastMessageAt?: Date;
}

export const SupportConversationSchema = SchemaFactory.createForClass(SupportConversation);
