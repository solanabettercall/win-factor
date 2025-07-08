import { Command } from '@nestjs/cqrs';
import { Competition } from '../../domain/entities/competition.entity';

export class SaveCompetitionCommand extends Command<void> {
  constructor(public readonly competition: Competition) {
    super();
  }
}
