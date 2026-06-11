import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type GroupBuyDocument = HydratedDocument<GroupBuy>;

export enum GroupBuyStatus {
  Open = 'open',
  MinimumMet = 'minimum_met',
  Submitted = 'submitted',
  Cancelled = 'cancelled',
}

@Schema({ _id: false })
export class GroupBuyParticipant {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  merchant: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  quantity: number;
}

export const GroupBuyParticipantSchema = SchemaFactory.createForClass(GroupBuyParticipant);

@Schema({ timestamps: true })
export class GroupBuy {
  @Prop({ type: Types.ObjectId, ref: 'DealerCatalogItem', required: true })
  catalogItem: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  dealer: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  targetQuantity: number;

  @Prop({ default: 0, min: 0 })
  currentQuantity: number;

  @Prop({ type: [GroupBuyParticipantSchema], default: [] })
  participants: GroupBuyParticipant[];

  @Prop({ enum: GroupBuyStatus, default: GroupBuyStatus.Open })
  status: GroupBuyStatus;
}

export const GroupBuySchema = SchemaFactory.createForClass(GroupBuy);
