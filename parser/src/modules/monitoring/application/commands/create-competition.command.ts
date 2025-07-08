import { Command } from '@nestjs/cqrs';
import { Competition } from '../../domain/entities/competition.entity';

export class CreateCompetitionCommand extends Command<void> {
  constructor(public readonly competition: Competition) {
    super();
  }
}
