import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { SaveMatchCommand } from '../../commands/save-match.command';
import {
  IMatchRepository,
  MATCH_REPOSITORY,
} from 'src/modules/monitoring/domain/repositories/match.repository.interface';

@CommandHandler(SaveMatchCommand)
export class SaveMatchCommandHandler
  implements ICommandHandler<SaveMatchCommand>
{
  constructor(
    @Inject(MATCH_REPOSITORY)
    private readonly matchRepository: IMatchRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: SaveMatchCommand) {
    const { match } = command;

    this.eventPublisher.mergeObjectContext(match);
    await this.matchRepository.save(match);
    match.commit();
  }
}
