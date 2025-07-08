import { Module } from '@nestjs/common';
import { COMPETITION_REPOSITORY } from './domain/repositories/competition.repository.interface';
import { ImMemoryCompetitionRepository } from './infrastructure/repositories/in-memory-competition.repository';
import { CompetitionsScraperService } from './application/services/competitions-scraper.service';
import { CreateCompetitionCommandHandler } from './application/handlers/commands/create-competition.handler';
import { GetCompetitionQueryHandler } from './application/handlers/queries/get-competition.handler';
import { CompetitionCreatedEventHandler } from './application/handlers/events/competition-created.handler';

const commandHandlers = [CreateCompetitionCommandHandler];

const queryHandlers = [GetCompetitionQueryHandler];

const eventHandlers = [CompetitionCreatedEventHandler];

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
    CompetitionsScraperService,
  ],
  exports: [],
})
export class MonitoringModule {}
