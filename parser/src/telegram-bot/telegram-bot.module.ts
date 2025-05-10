import { Module } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { MonitoringModule } from 'src/monitoring/monitoring.module';

@Module({
  imports: [MonitoringModule],
  providers: [TelegramBotService],
})
export class TelegramBotModule {}
