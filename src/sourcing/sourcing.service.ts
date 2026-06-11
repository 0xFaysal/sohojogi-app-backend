import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';
import { CreateWholesaleOrderDto } from './dto/create-wholesale-order.dto';
import { JoinGroupBuyDto } from './dto/join-group-buy.dto';
import {
  DealerCatalogItem,
  DealerCatalogItemDocument,
} from './schemas/dealer-catalog-item.schema';
import { GroupBuy, GroupBuyDocument, GroupBuyStatus } from './schemas/group-buy.schema';
import { WholesaleOrder, WholesaleOrderDocument } from './schemas/wholesale-order.schema';

@Injectable()
export class SourcingService {
  constructor(
    @InjectModel(DealerCatalogItem.name)
    private readonly catalogModel: Model<DealerCatalogItemDocument>,
    @InjectModel(WholesaleOrder.name)
    private readonly orderModel: Model<WholesaleOrderDocument>,
    @InjectModel(GroupBuy.name)
    private readonly groupBuyModel: Model<GroupBuyDocument>,
  ) {}

  async createCatalogItem(dealerId: string, dto: CreateCatalogItemDto) {
    return this.catalogModel.create({
      ...dto,
      dealer: new Types.ObjectId(dealerId),
    });
  }

  async listCatalog(category?: string) {
    const filter = category ? { available: true, category } : { available: true };
    return this.catalogModel.find(filter).populate('dealer', 'username email').sort({ name: 1 }).exec();
  }

  async createWholesaleOrder(merchantId: string, dto: CreateWholesaleOrderDto) {
    const item = await this.catalogModel.findById(dto.catalogItemId).exec();
    if (!item || !item.available) {
      throw new NotFoundException('Catalog item not found');
    }

    if (dto.quantity < item.minimumOrderQuantity) {
      throw new BadRequestException('Quantity is below minimum order quantity');
    }

    return this.orderModel.create({
      merchant: new Types.ObjectId(merchantId),
      dealer: item.dealer,
      catalogItem: new Types.ObjectId(item.id),
      quantity: dto.quantity,
      totalAmount: dto.quantity * item.wholesalePrice,
    });
  }

  async createGroupBuy(dealerId: string, catalogItemId: string, targetQuantity: number) {
    return this.groupBuyModel.create({
      dealer: new Types.ObjectId(dealerId),
      catalogItem: new Types.ObjectId(catalogItemId),
      targetQuantity,
    });
  }

  async joinGroupBuy(merchantId: string, dto: JoinGroupBuyDto) {
    const groupBuy = await this.groupBuyModel.findById(dto.groupBuyId).exec();
    if (!groupBuy || groupBuy.status === GroupBuyStatus.Cancelled) {
      throw new NotFoundException('Group buy not found');
    }

    groupBuy.participants.push({
      merchant: new Types.ObjectId(merchantId),
      quantity: dto.quantity,
    });
    groupBuy.currentQuantity += dto.quantity;
    groupBuy.status =
      groupBuy.currentQuantity >= groupBuy.targetQuantity
        ? GroupBuyStatus.MinimumMet
        : GroupBuyStatus.Open;

    return groupBuy.save();
  }

  async listGroupBuys() {
    return this.groupBuyModel
      .find({ status: { $in: [GroupBuyStatus.Open, GroupBuyStatus.MinimumMet] } })
      .populate('catalogItem')
      .populate('dealer', 'username email')
      .sort({ createdAt: -1 })
      .exec();
  }
}
