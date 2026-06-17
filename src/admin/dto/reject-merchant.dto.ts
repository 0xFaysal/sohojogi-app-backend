import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class RejectMerchantDto {
  @IsString()
  @MinLength(8)
  reason: string;

  @IsOptional()
  @IsString()
  tip?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rejectedSections?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rejectedFields?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  acceptedSections?: string[];
}
