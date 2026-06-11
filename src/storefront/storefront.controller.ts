import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequestUser } from '../common/types/request-user.type';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpsertProductDto } from './dto/upsert-product.dto';
import { StorefrontService } from './storefront.service';

@Controller('storefront')
export class StorefrontController {
  constructor(private readonly storefrontService: StorefrontService) {}

  @Get('stores')
  listPublicStores() {
    return this.storefrontService.listPublicStores();
  }

  @Get('stores/:storeId/products')
  listStoreProducts(@Param('storeId') storeId: string) {
    return this.storefrontService.listProducts(storeId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Merchant, Role.Admin)
  @Post('merchant/store')
  upsertStore(@Req() request: { user: RequestUser }, @Body() dto: CreateStoreDto) {
    return this.storefrontService.upsertStore(request.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Merchant, Role.Admin)
  @Get('merchant/products')
  listMerchantProducts(@Req() request: { user: RequestUser }) {
    return this.storefrontService.listMerchantProducts(request.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Merchant, Role.Admin)
  @Post('merchant/products')
  createProduct(@Req() request: { user: RequestUser }, @Body() dto: UpsertProductDto) {
    return this.storefrontService.upsertProduct(request.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Merchant, Role.Admin)
  @Patch('merchant/products/:productId')
  updateProduct(
    @Req() request: { user: RequestUser },
    @Param('productId') productId: string,
    @Body() dto: UpsertProductDto,
  ) {
    return this.storefrontService.upsertProduct(request.user.userId, dto, productId);
  }
}
