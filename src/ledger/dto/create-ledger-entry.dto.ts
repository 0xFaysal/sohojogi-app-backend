import { Type } from 'class-transformer';
import { IsDate, IsMongoId, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateLedgerEntryDto {
  @IsMongoId()
  consumerId: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @Type(() => Date)
  @IsDate()
  dueDate: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}
