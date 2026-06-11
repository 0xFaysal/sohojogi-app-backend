import { IsNumber, Min } from 'class-validator';

export class RecordRepaymentDto {
  @IsNumber()
  @Min(1)
  amount: number;
}
