import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateCatalogItemDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsNumber()
  @Min(0)
  wholesalePrice: number;

  @IsNumber()
  @Min(1)
  minimumOrderQuantity: number;

  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @IsOptional()
  @IsString()
  estimatedDelivery?: string;
}
