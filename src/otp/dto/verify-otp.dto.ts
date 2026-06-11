import { IsEmail, IsEnum, IsString, Length } from 'class-validator';
import { OtpPurpose } from '../schemas/otp.schema';

export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @IsEnum(OtpPurpose)
  purpose: OtpPurpose;

  @IsString()
  @Length(6, 6)
  code: string;
}
