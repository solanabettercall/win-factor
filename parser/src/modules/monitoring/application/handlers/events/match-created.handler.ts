import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { MatchCreatedEvent } from 'src/modules/monitoring/domain/events/match-created.event';

@EventsHandler(MatchCreatedEvent)
export class MatchCreatedEventHandler
  implements IEventHandler<MatchCreatedEvent>
{
  private readonly logger = new Logger(this.constructor.name);
  handle(event: MatchCreatedEvent) {
    const { match } = event;
    this.logger.debug(`Добавлен матч: ${match.id}`);
  }
}
