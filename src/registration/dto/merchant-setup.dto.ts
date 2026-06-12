import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class OperatingHourDto {
  @IsString()
  day: string;

  @IsBoolean()
  isOpen: boolean;

  @IsString()
  openTime: string;

  @IsString()
  closeTime: string;
}

class MerchantLocationDto {
  @IsString()
  division: string;

  @IsString()
  district: string;

  @IsString()
  upazila: string;

  @IsString()
  detailedAddress: string;

  @IsString()
  gpsPin: string;

  @IsString()
  areaType: string;

  @IsString()
  wardOrUnion: string;

  @IsString()
  postOffice: string;

  @IsOptional()
  @IsString()
  shopFrontPhotoUri?: string;

  @IsOptional()
  @IsString()
  interiorPhotoUri?: string;
}

class MerchantDocumentsDto {
  @IsString()
  ownerFullName: string;

  @IsString()
  dateOfBirth: string;

  @IsString()
  nidNumber: string;

  @IsOptional()
  @IsString()
  nidFrontImageUri?: string;

  @IsOptional()
  @IsString()
  nidBackImageUri?: string;

  @IsString()
  tradeLicenseNumber: string;

  @IsString()
  issuingAuthority: string;

  @IsString()
  issueDate: string;

  @IsString()
  expiryDate: string;

  @IsOptional()
  @IsString()
  tradeLicenseImageUri?: string;

  @IsOptional()
  @IsString()
  tinNumber?: string;

  @IsOptional()
  @IsString()
  tinCertificateImageUri?: string;
}

class MerchantBankDto {
  @IsString()
  bankName: string;

  @IsString()
  accountHolderName: string;

  @IsString()
  accountNumber: string;

  @IsString()
  branchName: string;
}

export class MerchantSetupDto {
  @IsString()
  merchantDraftId: string;

  @IsArray()
  @IsString({ each: true })
  shopType: string[];

  @IsString()
  shopPhone: string;

  @IsString()
  shopDescription: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperatingHourDto)
  operatingHours: OperatingHourDto[];

  @ValidateNested()
  @Type(() => MerchantLocationDto)
  location: MerchantLocationDto;

  @ValidateNested()
  @Type(() => MerchantDocumentsDto)
  documents: MerchantDocumentsDto;

  @ValidateNested()
  @Type(() => MerchantBankDto)
  bank: MerchantBankDto;
}

export class MerchantSetupDraftDto {
  @IsString()
  merchantDraftId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  shopType?: string[];

  @IsOptional()
  @IsString()
  shopPhone?: string;

  @IsOptional()
  @IsString()
  shopDescription?: string;

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  operatingHours?: Record<string, unknown>[];

  @IsOptional()
  @IsObject()
  location?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  documents?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  bank?: Record<string, unknown>;
}
