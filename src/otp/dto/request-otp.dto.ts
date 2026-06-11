import { IsEmail, IsEnum } from 'class-validator';
import { OtpPurpose } from '../schemas/otp.schema';

export class RequestOtpDto {
  @IsEmail()
  email: string;

  @IsEnum(OtpPurpose)
  purpose: OtpPurpose;
}
