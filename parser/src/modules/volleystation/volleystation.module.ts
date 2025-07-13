import { Module } from '@nestjs/common';
import { HttpModule, HttpModuleOptions } from '@nestjs/axios';
import { appConfig } from 'src/config/parser.config';
import { VolleystationApiService } from './application/volleystation-api.service';
import { VolleystationCompetitionApiService } from './infrastructure/volleystation-competition.service';
import { GetVolleystationCompetitionQueryHandler } from './application/handlers/queries/get-volleystation-competition.handler';
import { VolleystationTeamApiService } from './infrastructure/volleystation-team.service';
import { GetVolleystationTeamsQueryHandler } from './application/handlers/queries/get-volleystation-teams.handler';
import { VolleystationPlayerApiService } from './infrastructure/volleystation-player.service';
import { GetVolleystationPlayersQueryHandler } from './application/handlers/queries/get-volleystation-players.handler';
import { HttpClientService } from './infrastructure/http-client.service';
import { GetVolleystationMatchesQueryHandler } from './application/handlers/queries/get-volleystation-matches.handler';
import { VolleystationMatchApiService } from './infrastructure/volleystation-match.service';
import { GetVolleystationMatchQueryHandler } from './application/handlers/queries/get-volleystation-match.handler';
import { GetVolleystationTeamQueryHandler } from './application/handlers/queries/get-volleystation-team.handler';

const queryHandlers = [
  GetVolleystationCompetitionQueryHandler,
  GetVolleystationTeamsQueryHandler,
  GetVolleystationTeamQueryHandler,
  GetVolleystationPlayersQueryHandler,
  GetVolleystationMatchesQueryHandler,
  GetVolleystationMatchQueryHandler,
];

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
    VolleystationPlayerApiService,
    VolleystationMatchApiService,
    HttpClientService,
  ],
  exports: [],
})
export class VolleystationModule {}
