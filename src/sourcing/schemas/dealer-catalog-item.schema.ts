import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DealerCatalogItemDocument = HydratedDocument<DealerCatalogItem>;

@Schema({ timestamps: true })
export class DealerCatalogItem {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  dealer: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  category?: string;

  @Prop({ required: true, min: 0 })
  wholesalePrice: number;

  @Prop({ required: true, min: 1 })
  minimumOrderQuantity: number;

  @Prop({ default: true })
  available: boolean;

  @Prop({ trim: true })
  estimatedDelivery?: string;
}

export const DealerCatalogItemSchema = SchemaFactory.createForClass(DealerCatalogItem);
