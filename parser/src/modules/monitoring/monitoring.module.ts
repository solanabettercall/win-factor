import { Module } from '@nestjs/common';
import { COMPETITION_REPOSITORY } from './domain/repositories/competition.repository.interface';
import { PostgresCompetitionRepository } from './infrastructure/repositories/postgres-competition.repository';
import { ScraperService } from './application/services/scraper.service';
import { SaveCompetitionCommandHandler } from './application/handlers/commands/save-competition.handler';
import { GetCompetitionQueryHandler } from './application/handlers/queries/get-competition.handler';
import { CompetitionCreatedEventHandler } from './application/handlers/events/competition-created.handler';
import { TEAM_REPOSITORY } from './domain/repositories/team.repository.interface';
import { ImMemoryTeamRepository } from './infrastructure/repositories/in-memory-team.repository';
import { SaveTeamCommandHandler } from './application/handlers/commands/save-team.handler';
import { GetTeamQueryHandler } from './application/handlers/queries/get-team.handler';
import { TeamCreatedEventHandler } from './application/handlers/events/team-created.handler';
import { PlayerCreatedEventHandler } from './application/handlers/events/player-created.handler';
import { PLAYER_REPOSITORY } from './domain/repositories/player.repository.interface';
import { ImMemoryPlayerRepository } from './infrastructure/repositories/in-memory-player.repository';
import { SavePlayerCommandHandler } from './application/handlers/commands/save-player.handler';
import { GetPlayerQueryHandler } from './application/handlers/queries/get-player.handler';
import { MATCH_REPOSITORY } from './domain/repositories/match.repository.interface';
import { PostgresMatchRepository } from './infrastructure/repositories/postgres-match.repository';
import { SaveMatchCommandHandler } from './application/handlers/commands/save-match.handler';
import { GetMatchQueryHandler } from './application/handlers/queries/get-match.handler';
import { MatchCreatedEventHandler } from './application/handlers/events/match-created.handler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompetitionEntity } from './infrastructure/entities/competition.entity';
import { TeamEntity } from './infrastructure/entities/team.entity';
import { PlayerEntity } from './infrastructure/entities/player.entity';
import { MatchEntity } from './infrastructure/entities/match.entity';
import { appConfig } from 'src/config/parser.config';

const commandHandlers = [
  SaveCompetitionCommandHandler,
  SaveTeamCommandHandler,
  SavePlayerCommandHandler,
  SaveMatchCommandHandler,
];

const queryHandlers = [
  GetCompetitionQueryHandler,
  GetTeamQueryHandler,
  GetPlayerQueryHandler,
  GetMatchQueryHandler,
];

const eventHandlers = [
  CompetitionCreatedEventHandler,
  TeamCreatedEventHandler,
  PlayerCreatedEventHandler,
  MatchCreatedEventHandler,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory() {
        const { host, port, database, username, password } =
          appConfig().posgtres;

        return {
          type: 'postgres',
          host,
          port,
          username,
          password,
          database,
      entities: [CompetitionEntity, TeamEntity, PlayerEntity, MatchEntity],
          synchronize: true,
        };
      },
    }),
    TypeOrmModule.forFeature([CompetitionEntity, TeamEntity, PlayerEntity, MatchEntity]),
  ],
  providers: [
    ...commandHandlers,
    ...queryHandlers,
    ...eventHandlers,
    {
      provide: COMPETITION_REPOSITORY,
      useClass: PostgresCompetitionRepository,
    },

    {
      provide: TEAM_REPOSITORY,
      useClass: ImMemoryTeamRepository,
    },
    {
      provide: PLAYER_REPOSITORY,
      useClass: ImMemoryPlayerRepository,
    },
    {
      provide: MATCH_REPOSITORY,
      useClass: PostgresMatchRepository,
    },

    ScraperService,
  ],
  exports: [],
})
export class MonitoringModule {}
