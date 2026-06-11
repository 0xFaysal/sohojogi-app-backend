import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequestUser } from '../common/types/request-user.type';
import { StockAlertsService } from './stock-alerts.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Merchant, Role.Admin)
@Controller('stock-alerts')
export class StockAlertsController {
  constructor(private readonly stockAlertsService: StockAlertsService) {}

  @Get()
  listAlerts(@Req() request: { user: RequestUser }) {
    return this.stockAlertsService.listForMerchant(request.user.userId);
  }
}
