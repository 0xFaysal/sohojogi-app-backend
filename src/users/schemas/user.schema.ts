import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../../common/enums/role.enum';

export type UserDocument = HydratedDocument<User>;

export enum MerchantApplicationStatus {
  Draft = 'draft',
  SetupRequired = 'setupRequired',
  UnderReview = 'underReview',
  Rejected = 'rejected',
  Approved = 'approved',
}

class Address {
  @Prop({ trim: true })
  division?: string;

  @Prop({ trim: true })
  district?: string;

  @Prop({ trim: true })
  upazila?: string;

  @Prop({ trim: true })
  areaType?: string;

  @Prop({ trim: true })
  wardOrUnion?: string;

  @Prop({ trim: true })
  postOffice?: string;

  @Prop({ trim: true })
  detailedAddress?: string;
}

class GpsLocation {
  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  lng: number;

  @Prop()
  capturedAt?: Date;
}

class ConsumerProfile {
  @Prop({ trim: true })
  firstName?: string;

  @Prop({ trim: true })
  lastName?: string;

  @Prop({ trim: true })
  dob?: string;

  @Prop({ trim: true })
  gender?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ type: Object })
  presentAddress?: Address;

  @Prop({ type: Object })
  permanentAddress?: Address;

  @Prop()
  isPermanentSameAsPresent?: boolean;
}

class MerchantRejection {
  @Prop({ trim: true })
  reason?: string;

  @Prop({ trim: true })
  tip?: string;

  @Prop({ type: [String], default: [] })
  rejectedSections?: string[];

  @Prop({ type: [String], default: [] })
  acceptedSections?: string[];
}

class MerchantProfile {
  @Prop({ trim: true })
  shopName?: string;

  @Prop({ trim: true })
  ownerName?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ type: [String], default: [] })
  shopType?: string[];

  @Prop({ trim: true })
  shopPhone?: string;

  @Prop({ trim: true })
  shopDescription?: string;

  @Prop({ type: [Object], default: [] })
  operatingHours?: Record<string, unknown>[];

  @Prop({ type: Object })
  location?: Record<string, unknown>;

  @Prop({ type: Object })
  documents?: Record<string, unknown>;

  @Prop({ type: Object })
  bank?: Record<string, unknown>;

  @Prop({ type: String, enum: MerchantApplicationStatus, default: MerchantApplicationStatus.Draft })
  applicationStatus?: MerchantApplicationStatus;

  @Prop({ type: Object })
  rejection?: MerchantRejection;

  @Prop()
  submittedAt?: Date;

  @Prop()
  reviewedAt?: Date;

  @Prop({ trim: true })
  reviewedBy?: string;

  @Prop()
  approvedAt?: Date;

  @Prop()
  rejectedAt?: Date;
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  username: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ type: [String], enum: Role, default: [Role.Consumer] })
  roles: Role[];

  @Prop({ default: 500, min: 0, max: 1000 })
  bakiScore: number;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ type: Object })
  consumerProfile?: ConsumerProfile;

  @Prop({ type: Object })
  merchantProfile?: MerchantProfile;

  @Prop({ type: Object })
  registrationLocation?: GpsLocation;

  @Prop({ type: Object })
  lastLoginLocation?: GpsLocation;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  emailVerifiedAt?: Date;

  @Prop({ select: false })
  refreshTokenHash?: string;

  @Prop()
  passwordChangedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
