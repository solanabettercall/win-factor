import { Module } from '@nestjs/common';
import { COMPETITION_REPOSITORY } from './domain/repositories/competition.repository.interface';
import { ImMemoryCompetitionRepository } from './infrastructure/repositories/in-memory-competition.repository';
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

const commandHandlers = [
  SaveCompetitionCommandHandler,
  SaveTeamCommandHandler,
  SavePlayerCommandHandler,
];

const queryHandlers = [
  GetCompetitionQueryHandler,
  GetTeamQueryHandler,
  GetPlayerQueryHandler,
];

const eventHandlers = [
  CompetitionCreatedEventHandler,
  TeamCreatedEventHandler,
  PlayerCreatedEventHandler,
];

@Module({
  imports: [],
  providers: [
    ...commandHandlers,
    ...queryHandlers,
    ...eventHandlers,
    {
      provide: COMPETITION_REPOSITORY,
      useClass: ImMemoryCompetitionRepository,
    },

    {
      provide: TEAM_REPOSITORY,
      useClass: ImMemoryTeamRepository,
    },
    {
      provide: PLAYER_REPOSITORY,
      useClass: ImMemoryPlayerRepository,
    },

    ScraperService,
  ],
  exports: [],
})
export class MonitoringModule {}
