import { Module } from '@nestjs/common';
import { CveService } from './cve.service';
import { HttpModule, HttpModuleOptions } from '@nestjs/axios';
import { appConfig } from 'src/config/parser.config';

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
        if (appConfig().isLocal) {
          options.proxy = {
            host: '172.26.208.1',
            port: 8888,
            protocol: 'http',
          };
        }

        return options;
      },
    }),
  ],

  providers: [CveService],
})
export class CveModule {}
