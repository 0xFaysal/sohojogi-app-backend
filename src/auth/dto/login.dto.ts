import { Type } from 'class-transformer';
import { IsEmail, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

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

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GpsLocationDto)
  loginLocation?: GpsLocationDto;
}
