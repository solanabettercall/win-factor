import { Module } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { MonitoringModule } from 'src/monitoring/monitoring.module';
import { FormattingService } from './formating.service';

@Module({
  imports: [MonitoringModule],
  providers: [TelegramBotService, FormattingService],
})
export class TelegramBotModule {}
