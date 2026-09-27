import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ClientsModule } from './clients/clients.module.js';
import { LoansModule } from './loans/loans.module.js';
import { CashModule } from './cash/cash.module.js';
import { AnalyticsModule } from './analytics/analytics.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [ClientsModule, LoansModule, CashModule, AnalyticsModule, SettingsModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
