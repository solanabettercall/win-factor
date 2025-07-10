import { Command } from '@nestjs/cqrs';
import { IPlayer } from '../../domain/entities/player.entity';

export class SavePlayerCommand extends Command<void> {
  constructor(public readonly props: IPlayer) {
    super();
  }
}
