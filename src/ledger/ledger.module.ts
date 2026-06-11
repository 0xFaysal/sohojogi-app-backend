import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { LedgerController } from './ledger.controller';
import { LedgerService } from './ledger.service';
import { LedgerEntry, LedgerEntrySchema } from './schemas/ledger-entry.schema';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([{ name: LedgerEntry.name, schema: LedgerEntrySchema }]),
  ],
  controllers: [LedgerController],
  providers: [LedgerService],
})
export class LedgerModule {}
