import { IsMongoId, IsNumber, Min } from 'class-validator';

export class CreateWholesaleOrderDto {
  @IsMongoId()
  catalogItemId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}
