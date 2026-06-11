import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StockAlertsModule } from '../stock-alerts/stock-alerts.module';
import { Product, ProductSchema } from './schemas/product.schema';
import { Store, StoreSchema } from './schemas/store.schema';
import { StorefrontController } from './storefront.controller';
import { StorefrontService } from './storefront.service';

@Module({
  imports: [
    StockAlertsModule,
    MongooseModule.forFeature([
      { name: Store.name, schema: StoreSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [StorefrontController],
  providers: [StorefrontService],
})
export class StorefrontModule {}
