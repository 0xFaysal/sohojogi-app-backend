import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto';
import { RecordRepaymentDto } from './dto/record-repayment.dto';
import { LedgerEntry, LedgerEntryDocument, LedgerStatus } from './schemas/ledger-entry.schema';

@Injectable()
export class LedgerService {
  constructor(
    @InjectModel(LedgerEntry.name) private readonly ledgerModel: Model<LedgerEntryDocument>,
    private readonly usersService: UsersService,
  ) {}

  async createDue(merchantId: string, dto: CreateLedgerEntryDto) {
    await this.usersService.findById(dto.consumerId);

    return this.ledgerModel.create({
      merchant: new Types.ObjectId(merchantId),
      consumer: new Types.ObjectId(dto.consumerId),
      amount: dto.amount,
      dueDate: dto.dueDate,
      notes: dto.notes,
    });
  }

  async listForMerchant(merchantId: string) {
    return this.ledgerModel
      .find({ merchant: merchantId })
      .populate('consumer', 'username email bakiScore')
      .sort({ createdAt: -1 })
      .exec();
  }

  async listForConsumer(consumerId: string) {
    return this.ledgerModel
      .find({ consumer: consumerId })
      .populate('merchant', 'username email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async recordRepayment(entryId: string, dto: RecordRepaymentDto) {
    const entry = await this.ledgerModel.findById(entryId).exec();
    if (!entry) {
      throw new NotFoundException('Ledger entry not found');
    }

    entry.repaidAmount = Math.min(entry.amount, entry.repaidAmount + dto.amount);
    entry.repaidAt = new Date();
    entry.status =
      entry.repaidAmount >= entry.amount ? LedgerStatus.Paid : LedgerStatus.PartiallyPaid;

    if (entry.status === LedgerStatus.Paid) {
      const wasLate = entry.repaidAt.getTime() > entry.dueDate.getTime();
      entry.scoreImpact = wasLate ? -15 : 5;
      await this.usersService.updateBakiScore(entry.consumer.toString(), entry.scoreImpact);
    }

    return entry.save();
  }
}
