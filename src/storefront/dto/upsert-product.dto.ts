import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpsertProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  threshold?: number;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @IsOptional()
  @IsBoolean()
  preorderAvailable?: boolean;
}
