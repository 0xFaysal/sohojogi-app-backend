import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { IsMongoId, IsNumber, Min } from 'class-validator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequestUser } from '../common/types/request-user.type';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';
import { CreateWholesaleOrderDto } from './dto/create-wholesale-order.dto';
import { JoinGroupBuyDto } from './dto/join-group-buy.dto';
import { SourcingService } from './sourcing.service';

class CreateGroupBuyDto {
  @IsMongoId()
  catalogItemId: string;

  @IsNumber()
  @Min(1)
  targetQuantity: number;
}

@Controller('sourcing')
export class SourcingController {
  constructor(private readonly sourcingService: SourcingService) {}

  @Get('catalog')
  listCatalog(@Query('category') category?: string) {
    return this.sourcingService.listCatalog(category);
  }

  @Get('group-buys')
  listGroupBuys() {
    return this.sourcingService.listGroupBuys();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Dealer, Role.Admin)
  @Post('catalog')
  createCatalogItem(@Req() request: { user: RequestUser }, @Body() dto: CreateCatalogItemDto) {
    return this.sourcingService.createCatalogItem(request.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Merchant, Role.Admin)
  @Post('orders')
  createWholesaleOrder(@Req() request: { user: RequestUser }, @Body() dto: CreateWholesaleOrderDto) {
    return this.sourcingService.createWholesaleOrder(request.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Dealer, Role.Admin)
  @Post('group-buys')
  createGroupBuy(@Req() request: { user: RequestUser }, @Body() dto: CreateGroupBuyDto) {
    return this.sourcingService.createGroupBuy(
      request.user.userId,
      dto.catalogItemId,
      dto.targetQuantity,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Merchant, Role.Admin)
  @Post('group-buys/join')
  joinGroupBuy(@Req() request: { user: RequestUser }, @Body() dto: JoinGroupBuyDto) {
    return this.sourcingService.joinGroupBuy(request.user.userId, dto);
  }
}
