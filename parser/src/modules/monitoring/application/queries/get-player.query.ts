import { Query } from '@nestjs/cqrs';
import { PlayerId } from '../../domain/value-objects/player-id.vo';
import { Player } from '../../domain/entities/player.entity';

export class GetPlayerQuery extends Query<Player | null> {
  constructor(public readonly id: PlayerId) {
    super();
  }
}
