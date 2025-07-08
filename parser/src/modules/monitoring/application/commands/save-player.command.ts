import { Command } from '@nestjs/cqrs';
import { Player } from '../../domain/entities/player.entity';

export class SavePlayerCommand extends Command<void> {
  constructor(public readonly player: Player) {
    super();
  }
}
