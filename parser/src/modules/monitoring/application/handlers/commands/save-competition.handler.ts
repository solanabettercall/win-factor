import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { SaveCompetitionCommand } from '../../commands/save-competition.command';
import { Inject } from '@nestjs/common';
import {
  COMPETITION_REPOSITORY,
  ICompetitionRepository,
} from '../../../domain/repositories/competition.repository.interface';

@CommandHandler(SaveCompetitionCommand)
export class SaveCompetitionCommandHandler
  implements ICommandHandler<SaveCompetitionCommand>
{
  constructor(
    @Inject(COMPETITION_REPOSITORY)
    private readonly competitionRepository: ICompetitionRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: SaveCompetitionCommand) {
    const { competition } = command;

    this.eventPublisher.mergeObjectContext(competition);
    await this.competitionRepository.save(competition);
    competition.commit();
  }
}
