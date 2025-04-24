import { Logger, Module } from '@nestjs/common';
import { CveService } from './cve.service';
import { HttpModule, HttpModuleOptions } from '@nestjs/axios';
import { appConfig } from 'src/config/parser.config';
import { CompetitionService } from './competition.service';
import { CalendarService } from './calendar.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: () => {
        const logger = new Logger(CveModule.name);
        const options: HttpModuleOptions = {
          headers: {
            'user-agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0',
          },
        };
        const config = appConfig();
        if (config.isLocal && config.proxy) {
          options.proxy = {
            ...config.proxy,
            protocol: 'http',
          };
          logger.log(
            `Используется прокси: ${config.proxy.host}:${config.proxy.port}`,
          );
        } else {
          logger.log('Прокси не задан');
        }

        return options;
      },
    }),
  ],

  providers: [CveService, CompetitionService, CalendarService],
})
export class CveModule {}
