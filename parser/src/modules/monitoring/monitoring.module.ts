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

const commandHandlers = [SaveCompetitionCommandHandler, SaveTeamCommandHandler];

const queryHandlers = [GetCompetitionQueryHandler, GetTeamQueryHandler];

const eventHandlers = [CompetitionCreatedEventHandler, TeamCreatedEventHandler];

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
    ScraperService,
  ],
  exports: [],
})
export class MonitoringModule {}
