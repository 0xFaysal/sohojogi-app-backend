import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LedgerEntryDocument = HydratedDocument<LedgerEntry>;

export enum LedgerStatus {
  Due = 'due',
  PartiallyPaid = 'partially_paid',
  Paid = 'paid',
  Overdue = 'overdue',
}

@Schema({ timestamps: true })
export class LedgerEntry {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  merchant: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  consumer: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ default: 0, min: 0 })
  repaidAmount: number;

  @Prop({ required: true })
  dueDate: Date;

  @Prop({ enum: LedgerStatus, default: LedgerStatus.Due })
  status: LedgerStatus;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ default: 0 })
  scoreImpact: number;

  @Prop()
  repaidAt?: Date;
}

export const LedgerEntrySchema = SchemaFactory.createForClass(LedgerEntry);
