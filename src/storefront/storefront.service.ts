import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StockAlertsService } from '../stock-alerts/stock-alerts.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpsertProductDto } from './dto/upsert-product.dto';
import { Product, ProductDocument } from './schemas/product.schema';
import { Store, StoreDocument } from './schemas/store.schema';

@Injectable()
export class StorefrontService {
  constructor(
    @InjectModel(Store.name) private readonly storeModel: Model<StoreDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    private readonly stockAlertsService: StockAlertsService,
  ) {}

  async upsertStore(merchantId: string, dto: CreateStoreDto) {
    return this.storeModel.findOneAndUpdate(
      { merchant: merchantId },
      { ...dto, merchant: new Types.ObjectId(merchantId) },
      { new: true, upsert: true },
    );
  }

  async getMerchantStore(merchantId: string) {
    const store = await this.storeModel.findOne({ merchant: merchantId }).exec();
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return store;
  }

  async listPublicStores() {
    return this.storeModel.find({ active: true }).sort({ createdAt: -1 }).exec();
  }

  async upsertProduct(merchantId: string, dto: UpsertProductDto, productId?: string) {
    const store = await this.getMerchantStore(merchantId);
    const update = {
      ...dto,
      merchant: new Types.ObjectId(merchantId),
      store: new Types.ObjectId(store.id),
      lastRestockedAt: dto.stock > 0 ? new Date() : undefined,
    };

    const product = productId
      ? await this.productModel.findOneAndUpdate({ _id: productId, merchant: merchantId }, update, {
          new: true,
        })
      : await this.productModel.create(update);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.stockAlertsService.checkAndCreate({
      merchantId,
      productId: product.id,
      currentStock: product.stock,
      threshold: product.threshold,
    });

    return product;
  }

  async listProducts(storeId: string) {
    return this.productModel.find({ store: storeId, visible: true }).sort({ name: 1 }).exec();
  }

  async listMerchantProducts(merchantId: string) {
    return this.productModel.find({ merchant: merchantId }).sort({ createdAt: -1 }).exec();
  }
}
