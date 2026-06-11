import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DealerCatalogItem,
  DealerCatalogItemSchema,
} from './schemas/dealer-catalog-item.schema';
import { GroupBuy, GroupBuySchema } from './schemas/group-buy.schema';
import { WholesaleOrder, WholesaleOrderSchema } from './schemas/wholesale-order.schema';
import { SourcingController } from './sourcing.controller';
import { SourcingService } from './sourcing.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DealerCatalogItem.name, schema: DealerCatalogItemSchema },
      { name: WholesaleOrder.name, schema: WholesaleOrderSchema },
      { name: GroupBuy.name, schema: GroupBuySchema },
    ]),
  ],
  controllers: [SourcingController],
  providers: [SourcingService],
})
export class SourcingModule {}
