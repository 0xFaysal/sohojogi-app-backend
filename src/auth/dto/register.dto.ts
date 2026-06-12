import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Role } from '../../common/enums/role.enum';

class AddressDto {
  @IsString()
  division: string;

  @IsString()
  district: string;

  @IsString()
  upazila: string;

  @IsString()
  areaType: string;

  @IsString()
  wardOrUnion: string;

  @IsString()
  postOffice: string;

  @IsString()
  detailedAddress: string;
}

class GpsLocationDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}

class ConsumerProfileDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  dob?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsString()
  phone: string;

  @ValidateNested()
  @Type(() => AddressDto)
  presentAddress: AddressDto;

  @ValidateNested()
  @Type(() => AddressDto)
  permanentAddress: AddressDto;

  @IsBoolean()
  isPermanentSameAsPresent: boolean;
}

class MerchantProfileDto {
  @IsString()
  shopName: string;

  @IsString()
  ownerName: string;

  @IsString()
  phone: string;
}

export class RegisterDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true })
  roles?: Role[];

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ConsumerProfileDto)
  consumerProfile?: ConsumerProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => MerchantProfileDto)
  merchantProfile?: MerchantProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => GpsLocationDto)
  registrationLocation?: GpsLocationDto;
}
