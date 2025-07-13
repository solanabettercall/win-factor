import { Command } from '@nestjs/cqrs';
import { Team } from '../../domain/entities/team.entity';

export class SaveTeamCommand extends Command<void> {
  constructor(public readonly team: Team) {
    super();
  }
}
