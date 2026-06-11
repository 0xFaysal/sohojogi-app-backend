import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type StockAlertDocument = HydratedDocument<StockAlert>;

@Schema({ timestamps: true })
export class StockAlert {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  merchant: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ required: true })
  currentStock: number;

  @Prop({ required: true })
  threshold: number;

  @Prop({ default: false })
  resolved: boolean;
}

export const StockAlertSchema = SchemaFactory.createForClass(StockAlert);
