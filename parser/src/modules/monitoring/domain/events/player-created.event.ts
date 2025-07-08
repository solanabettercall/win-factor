import { BaseEvent } from 'src/shared/domain/events/base.event';
import { IPlayer } from '../entities/player.entity';

export class PlayerCreatedEvent extends BaseEvent<IPlayer> {
  constructor(public readonly player: IPlayer) {
    super(player);
  }
}
