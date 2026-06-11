import { IsMongoId, IsNumber, Min } from 'class-validator';

export class JoinGroupBuyDto {
  @IsMongoId()
  groupBuyId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}
