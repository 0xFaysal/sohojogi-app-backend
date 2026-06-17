import { Body, Controller, Get, Header, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequestUser } from '../common/types/request-user.type';
import { AdminService } from './admin.service';
import { renderAdminUi } from './admin-ui';
import { ListMerchantApplicationsDto } from './dto/list-merchant-applications.dto';
import { RejectMerchantDto } from './dto/reject-merchant.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  adminUi() {
    return renderAdminUi();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Get('api/merchants')
  listMerchantApplications(@Query() query: ListMerchantApplicationsDto) {
    return this.adminService.listMerchantApplications(query.status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Get('api/merchants/:merchantId')
  getMerchantApplication(@Param('merchantId') merchantId: string) {
    return this.adminService.getMerchantApplication(merchantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Post('api/merchants/:merchantId/approve')
  approveMerchantApplication(
    @Param('merchantId') merchantId: string,
    @Req() request: { user: RequestUser },
  ) {
    return this.adminService.approveMerchantApplication(merchantId, request.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Post('api/merchants/:merchantId/reject')
  rejectMerchantApplication(
    @Param('merchantId') merchantId: string,
    @Req() request: { user: RequestUser },
    @Body() dto: RejectMerchantDto,
  ) {
    return this.adminService.rejectMerchantApplication(merchantId, request.user.userId, dto);
  }
}
