import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SCRAPER_QUEUE } from './consts/queue';
import { CacheScraperProcessor } from './cache-scraper.processor';
import { CacheScraperService } from './cache-scraper.service';
import { VolleystationModule } from '../sites/volleystation/volleystation.module';
import { MonitoringModule } from 'src/monitoring/monitoring.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: SCRAPER_QUEUE,
      defaultJobOptions: {
        removeOnComplete: {
          age: 60,
        },
      },
    }),
    VolleystationModule,
    MonitoringModule,
  ],
  providers: [CacheScraperProcessor, CacheScraperService],
})
export class CacheScraperModule {}
