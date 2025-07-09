import { Command } from '@nestjs/cqrs';
import { Match } from '../../domain/entities/match.entity';

export class SaveMatchCommand extends Command<void> {
  constructor(public readonly match: Match) {
    super();
  }
}
