import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { TeamCreatedEvent } from 'src/modules/monitoring/domain/events/team-created.event';

@EventsHandler(TeamCreatedEvent)
export class TeamCreatedEventHandler
  implements IEventHandler<TeamCreatedEvent>
{
  private readonly logger = new Logger(this.constructor.name);
  handle(event: TeamCreatedEvent) {
    const { team } = event;
    this.logger.debug(`Добавлена команда: ${team.name.toString()}`);
  }
}
