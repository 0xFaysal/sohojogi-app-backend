import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RequestUser } from '../common/types/request-user.type';
import { MerchantSetupDraftDto, MerchantSetupDto } from './dto/merchant-setup.dto';
import { RegistrationService } from './registration.service';

@UseGuards(JwtAuthGuard)
@Controller('registration')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Post('merchants/setup-draft')
  saveMerchantSetupDraft(
    @Req() request: { user: RequestUser },
    @Body() dto: MerchantSetupDraftDto,
  ) {
    return this.registrationService.saveMerchantSetupDraft(request.user.userId, dto);
  }

  @Post('merchants/submit')
  submitMerchantApplication(
    @Req() request: { user: RequestUser },
    @Body() dto: MerchantSetupDto,
  ) {
    return this.registrationService.submitMerchantApplication(request.user.userId, dto);
  }

  @Post('merchants/resubmit')
  resubmitMerchantApplication(
    @Req() request: { user: RequestUser },
    @Body() dto: MerchantSetupDto,
  ) {
    return this.registrationService.submitMerchantApplication(request.user.userId, dto);
  }

  @Get('merchants/:merchantDraftId/status')
  getMerchantApplicationStatus(
    @Req() request: { user: RequestUser },
    @Param('merchantDraftId') _merchantDraftId: string,
  ) {
    return this.registrationService.getMerchantApplicationStatus(request.user.userId);
  }
}
