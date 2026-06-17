import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { EmailModule } from './email/email.module';
import { HealthModule } from './health/health.module';
import { LedgerModule } from './ledger/ledger.module';
import { MerchantAssetsModule } from './merchant-assets/merchant-assets.module';
import { OtpModule } from './otp/otp.module';
import { RegistrationModule } from './registration/registration.module';
import { SourcingModule } from './sourcing/sourcing.module';
import { StockAlertsModule } from './stock-alerts/stock-alerts.module';
import { StorefrontModule } from './storefront/storefront.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('MONGO_URI')?.trim();

        if (!uri) {
          throw new Error('MONGO_URI is required');
        }

        return {
          uri,
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000,
          socketTimeoutMS: 15000,
        };
      },
    }),
    HealthModule,
    AdminModule,
    EmailModule,
    AuthModule,
    UsersModule,
    MerchantAssetsModule,
    OtpModule,
    RegistrationModule,
    LedgerModule,
    StorefrontModule,
    SourcingModule,
    StockAlertsModule,
    ChatModule,
  ],
})
export class AppModule {}
