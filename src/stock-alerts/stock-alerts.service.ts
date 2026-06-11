import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StockAlert, StockAlertDocument } from './schemas/stock-alert.schema';

interface StockAlertInput {
  merchantId: string;
  productId: string;
  currentStock: number;
  threshold: number;
}

@Injectable()
export class StockAlertsService {
  constructor(
    @InjectModel(StockAlert.name) private readonly stockAlertModel: Model<StockAlertDocument>,
  ) {}

  async checkAndCreate(input: StockAlertInput) {
    if (input.currentStock > input.threshold) {
      await this.stockAlertModel.updateMany(
        { product: input.productId, resolved: false },
        { resolved: true },
      );
      return null;
    }

    return this.stockAlertModel.findOneAndUpdate(
      { product: input.productId, resolved: false },
      {
        merchant: new Types.ObjectId(input.merchantId),
        product: new Types.ObjectId(input.productId),
        currentStock: input.currentStock,
        threshold: input.threshold,
        resolved: false,
      },
      { new: true, upsert: true },
    );
  }

  async listForMerchant(merchantId: string) {
    return this.stockAlertModel
      .find({ merchant: merchantId, resolved: false })
      .populate('product')
      .sort({ createdAt: -1 })
      .exec();
  }
}
