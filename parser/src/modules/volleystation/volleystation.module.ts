import { Module } from '@nestjs/common';
import { HttpModule, HttpModuleOptions } from '@nestjs/axios';
import { appConfig } from 'src/config/parser.config';
import { VolleystationApiService } from './application/volleystation-api.service';
import { VolleystationCompetitionApiService } from './infrastructure/volleystation-competition.service';
import { GetVolleystationCompetitionQueryHandler } from './application/handlers/queries/get-volleystation-competition.handler';
import { VolleystationTeamApiService } from './infrastructure/volleystation-team.service';

const queryHandlers = [GetVolleystationCompetitionQueryHandler];

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
    ...queryHandlers,
    VolleystationApiService,
    VolleystationCompetitionApiService,
    VolleystationTeamApiService,
  ],
  exports: [],
})
export class VolleystationModule {}
