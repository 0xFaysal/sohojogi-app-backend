import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OtpDocument = HydratedDocument<Otp>;

export enum OtpPurpose {
  EmailVerification = 'email_verification',
  PasswordReset = 'password_reset',
  Login = 'login',
}

@Schema({ timestamps: true })
export class Otp {
  @Prop({ required: true, lowercase: true, trim: true, index: true })
  email: string;

  @Prop({ required: true, enum: OtpPurpose })
  purpose: OtpPurpose;

  @Prop({ required: true, select: false })
  codeHash: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: 0 })
  attempts: number;

  @Prop()
  consumedAt?: Date;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);
OtpSchema.index({ email: 1, purpose: 1, consumedAt: 1 });
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
