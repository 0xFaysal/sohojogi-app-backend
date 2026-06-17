import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MerchantAssetsController } from './merchant-assets.controller';
import { MerchantAssetsService } from './merchant-assets.service';
import { MerchantAsset, MerchantAssetSchema } from './schemas/merchant-asset.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: MerchantAsset.name, schema: MerchantAssetSchema }])],
  controllers: [MerchantAssetsController],
  providers: [MerchantAssetsService],
})
export class MerchantAssetsModule {}
