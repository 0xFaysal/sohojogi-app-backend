import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StockAlert, StockAlertSchema } from './schemas/stock-alert.schema';
import { StockAlertsController } from './stock-alerts.controller';
import { StockAlertsService } from './stock-alerts.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: StockAlert.name, schema: StockAlertSchema }])],
  controllers: [StockAlertsController],
  providers: [StockAlertsService],
  exports: [StockAlertsService],
})
export class StockAlertsModule {}
