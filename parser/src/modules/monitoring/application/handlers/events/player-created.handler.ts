import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { PlayerCreatedEvent } from 'src/modules/monitoring/domain/events/player-created.event';

@EventsHandler(PlayerCreatedEvent)
export class PlayerCreatedEventHandler
  implements IEventHandler<PlayerCreatedEvent>
{
  private readonly logger = new Logger(this.constructor.name);
  handle(event: PlayerCreatedEvent) {
    const { player } = event;
    this.logger.debug(`Добавлен игрок: ${player.name.toString()}`);
  }
}
