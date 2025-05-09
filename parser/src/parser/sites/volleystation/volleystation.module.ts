import { Module } from '@nestjs/common';
import { VolleystationService } from './volleystation.service';
import { HttpModule, HttpModuleOptions } from '@nestjs/axios';
import { appConfig } from 'src/config/parser.config';
import { VolleystationSocketService } from './volleystation-socket.service';
import { VolleystationCacheService } from './volleystation-cache.service';
import { VolleystationCacheScraperService } from './volleystation-cache-scraper.service';
import { BullModule } from '@nestjs/bullmq';
import { CacheScraperProcessor } from './volleystation-cache-scraper.processor';
import { SCRAPER_QUEUE } from './consts/queue';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: () => {
        const options: HttpModuleOptions = {
          headers: {
            'user-agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0',
          },
        };
        const config = appConfig();
        if (config.isLocal && config.proxy) {
          options.proxy = {
            host: config.proxy.host,
            port: config.proxy.port,
            protocol: 'http',
          };
        }

        return options;
      },
    }),

    BullModule.registerQueue({
      name: SCRAPER_QUEUE,
      defaultJobOptions: {
        removeOnComplete: {
          age: 60,
        },
      },
    }),
  ],
  providers: [
    CacheScraperProcessor,
    VolleystationService,
    VolleystationSocketService,
    VolleystationCacheService,
    VolleystationCacheScraperService,
  ],
  exports: [
    VolleystationService,
    VolleystationSocketService,
    VolleystationCacheService,
  ],
})
export class VolleystationModule {}
