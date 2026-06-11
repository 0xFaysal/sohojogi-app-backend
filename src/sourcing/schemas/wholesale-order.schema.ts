import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WholesaleOrderDocument = HydratedDocument<WholesaleOrder>;

export enum WholesaleOrderStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Scheduled = 'scheduled',
  Delivered = 'delivered',
  Cancelled = 'cancelled',
}

@Schema({ timestamps: true })
export class WholesaleOrder {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  merchant: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  dealer: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'DealerCatalogItem', required: true })
  catalogItem: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ enum: WholesaleOrderStatus, default: WholesaleOrderStatus.Pending })
  status: WholesaleOrderStatus;
}

export const WholesaleOrderSchema = SchemaFactory.createForClass(WholesaleOrder);
