import { BadRequestException, Injectable } from '@nestjs/common';
import { MerchantApplicationStatus } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { RejectMerchantDto } from './dto/reject-merchant.dto';

@Injectable()
export class AdminService {
  constructor(private readonly usersService: UsersService) {}

  listMerchantApplications(status?: MerchantApplicationStatus) {
    return this.usersService.listMerchantApplications(status);
  }

  getMerchantApplication(merchantId: string) {
    return this.usersService.getMerchantApplicationForAdmin(merchantId);
  }

  async approveMerchantApplication(merchantId: string, adminId: string) {
    const merchant = await this.usersService.getMerchantApplicationForAdmin(merchantId);

    if (merchant.merchantProfile.applicationStatus !== MerchantApplicationStatus.UnderReview) {
      throw new BadRequestException('Only applications under review can be approved');
    }

    await this.usersService.updateMerchantApplicationReview(merchantId, {
      status: MerchantApplicationStatus.Approved,
      reviewedBy: adminId,
    });

    return this.usersService.getMerchantApplicationForAdmin(merchantId);
  }

  async rejectMerchantApplication(
    merchantId: string,
    adminId: string,
    rejection: RejectMerchantDto,
  ) {
    const merchant = await this.usersService.getMerchantApplicationForAdmin(merchantId);

    if (merchant.merchantProfile.applicationStatus !== MerchantApplicationStatus.UnderReview) {
      throw new BadRequestException('Only applications under review can be rejected');
    }

    await this.usersService.updateMerchantApplicationReview(merchantId, {
      status: MerchantApplicationStatus.Rejected,
      reviewedBy: adminId,
      rejection,
    });

    return this.usersService.getMerchantApplicationForAdmin(merchantId);
  }
}
