import { Module } from '@nestjs/common';
import { VolleystationService } from './volleystation.service';
import { HttpModule, HttpModuleOptions } from '@nestjs/axios';
import { appConfig } from 'src/config/parser.config';
import { VolleystationSocketService } from './volleystation-socket.service';
import { VolleystationCacheService } from './volleystation-cache.service';

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
  ],
  providers: [
    VolleystationService,
    VolleystationSocketService,
    VolleystationCacheService,
  ],
  exports: [VolleystationService, VolleystationCacheService],
})
export class VolleystationModule {}
