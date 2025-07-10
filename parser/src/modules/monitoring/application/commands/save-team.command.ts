import { Command } from '@nestjs/cqrs';
import { ITeam } from '../../domain/entities/team.entity';

export class SaveTeamCommand extends Command<void> {
  constructor(public readonly props: ITeam) {
    super();
  }
}
