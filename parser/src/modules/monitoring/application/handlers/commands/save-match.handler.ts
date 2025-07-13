import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { SaveMatchCommand } from '../../commands/save-match.command';
import {
  IMatchRepository,
  MATCH_REPOSITORY,
} from 'src/modules/monitoring/domain/repositories/match.repository.interface';
import {
  ITeamRepository,
  TEAM_REPOSITORY,
} from 'src/modules/monitoring/domain/repositories/team.repository.interface';

@CommandHandler(SaveMatchCommand)
export class SaveMatchCommandHandler
  implements ICommandHandler<SaveMatchCommand>
{
  constructor(
    @Inject(MATCH_REPOSITORY)
    private readonly matchRepository: IMatchRepository,
    @Inject(TEAM_REPOSITORY)
    private readonly teamRepository: ITeamRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: SaveMatchCommand) {
    const { match } = command;

    const { id } = match;
    const matchEntity = await this.matchRepository.findById(id);

    if (matchEntity) {
      // const match = Match.create(props);
      this.eventPublisher.mergeObjectContext(match);
      await this.matchRepository.save(match);
      match.commit();
    } else {
      // const match = Match.create(props);
      this.eventPublisher.mergeObjectContext(match);
      await this.matchRepository.save(match);
      match.commit();
    }
  }
}
