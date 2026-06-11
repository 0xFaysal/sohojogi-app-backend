import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequestUser } from '../common/types/request-user.type';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto';
import { RecordRepaymentDto } from './dto/record-repayment.dto';
import { LedgerService } from './ledger.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Roles(Role.Merchant, Role.Admin)
  @Post('dues')
  createDue(@Req() request: { user: RequestUser }, @Body() dto: CreateLedgerEntryDto) {
    return this.ledgerService.createDue(request.user.userId, dto);
  }

  @Roles(Role.Merchant, Role.Admin)
  @Get('merchant')
  listMerchantDues(@Req() request: { user: RequestUser }) {
    return this.ledgerService.listForMerchant(request.user.userId);
  }

  @Roles(Role.Consumer, Role.Admin)
  @Get('consumer')
  listConsumerDues(@Req() request: { user: RequestUser }) {
    return this.ledgerService.listForConsumer(request.user.userId);
  }

  @Roles(Role.Merchant, Role.Admin)
  @Patch(':id/repayments')
  recordRepayment(@Param('id') id: string, @Body() dto: RecordRepaymentDto) {
    return this.ledgerService.recordRepayment(id, dto);
  }
}
