import { IsEnum, IsOptional } from 'class-validator';
import { MerchantApplicationStatus } from '../../users/schemas/user.schema';

export class ListMerchantApplicationsDto {
  @IsOptional()
  @IsEnum(MerchantApplicationStatus)
  status?: MerchantApplicationStatus;
}
