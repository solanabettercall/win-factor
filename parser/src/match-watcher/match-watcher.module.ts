import { Module } from '@nestjs/common';
import { MatchWatcherService } from './match-watcher.service.service';
import { MonitoringModule } from 'src/monitoring/monitoring.module';
import { VolleystationModule } from 'src/parser/sites/volleystation/volleystation.module';
import { MatchNotificationCacheService } from './match-notification-cache.service';

@Module({
  imports: [MonitoringModule, VolleystationModule],
  providers: [MatchWatcherService, MatchNotificationCacheService],
})
export class MatchWatcherModule {}
