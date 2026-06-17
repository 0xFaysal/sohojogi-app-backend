import { ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '../common/enums/role.enum';
import { MerchantApplicationStatus } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { MerchantSetupDraftDto, MerchantSetupDto } from './dto/merchant-setup.dto';

@Injectable()
export class RegistrationService {
  constructor(private readonly usersService: UsersService) {}

  async saveMerchantSetupDraft(userId: string, dto: MerchantSetupDraftDto) {
    await this.assertMerchant(userId);
    await this.usersService.updateMerchantProfile(
      userId,
      dto as unknown as Record<string, unknown>,
    );

    return { message: 'Merchant setup draft saved' };
  }

  async getMerchantSetupDraft(userId: string) {
    await this.assertMerchant(userId);
    return this.usersService.getMerchantSetupDraft(userId);
  }

  async submitMerchantApplication(userId: string, dto: MerchantSetupDto) {
    await this.assertMerchant(userId);
    await this.usersService.updateMerchantProfile(
      userId,
      dto as unknown as Record<string, unknown>,
      MerchantApplicationStatus.UnderReview,
      true,
    );

    return { status: MerchantApplicationStatus.UnderReview };
  }

  async getMerchantApplicationStatus(userId: string) {
    await this.assertMerchant(userId);
    return this.usersService.getMerchantApplicationStatus(userId);
  }

  private async assertMerchant(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user.roles.includes(Role.Merchant)) {
      throw new ForbiddenException('Only merchant accounts can use merchant registration');
    }
  }
}
