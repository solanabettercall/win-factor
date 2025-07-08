import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { CompetitionCreatedEvent } from '../../../domain/events/competition-created.event';

@EventsHandler(CompetitionCreatedEvent)
export class CompetitionCreatedEventHandler
  implements IEventHandler<CompetitionCreatedEvent>
{
  private readonly logger = new Logger(this.constructor.name);
  handle(event: CompetitionCreatedEvent) {
    const { competition } = event;
    this.logger.debug(`Добавлен турнир: ${competition.name.toString()}`);
  }
}
