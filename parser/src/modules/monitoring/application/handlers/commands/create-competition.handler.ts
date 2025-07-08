import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { CreateCompetitionCommand } from '../../commands/create-competition.command';
import { Inject } from '@nestjs/common';
import {
  COMPETITION_REPOSITORY,
  ICompetitionRepository,
} from '../../../domain/repositories/competition.repository.interface';

@CommandHandler(CreateCompetitionCommand)
export class CreateCompetitionCommandHandler
  implements ICommandHandler<CreateCompetitionCommand>
{
  constructor(
    @Inject(COMPETITION_REPOSITORY)
    private readonly competitionRepository: ICompetitionRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: CreateCompetitionCommand) {
    const { competition } = command;

    this.eventPublisher.mergeObjectContext(competition);
    await this.competitionRepository.save(competition);
    competition.commit();
  }
}
