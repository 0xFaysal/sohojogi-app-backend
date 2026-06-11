import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type StoreDocument = HydratedDocument<Store>;

@Schema({ timestamps: true })
export class Store {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  merchant: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  photoUrl?: string;

  @Prop({ type: { lat: Number, lng: Number } })
  location?: { lat: number; lng: number };

  @Prop({ trim: true })
  hours?: string;

  @Prop({ default: true })
  active: boolean;
}

export const StoreSchema = SchemaFactory.createForClass(Store);
