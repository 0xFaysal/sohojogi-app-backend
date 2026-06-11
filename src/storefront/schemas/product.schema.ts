import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop({ type: Types.ObjectId, ref: 'Store', required: true })
  store: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  merchant: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  category?: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ default: 0, min: 0 })
  stock: number;

  @Prop({ default: 5, min: 0 })
  threshold: number;

  @Prop({ default: true })
  visible: boolean;

  @Prop({ default: false })
  preorderAvailable: boolean;

  @Prop()
  lastRestockedAt?: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
