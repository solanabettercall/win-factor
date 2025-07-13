import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { SaveTeamCommand } from '../../commands/save-team.command';
import {
  ITeamRepository,
  TEAM_REPOSITORY,
} from 'src/modules/monitoring/domain/repositories/team.repository.interface';

@CommandHandler(SaveTeamCommand)
export class SaveTeamCommandHandler
  implements ICommandHandler<SaveTeamCommand>
{
  constructor(
    @Inject(TEAM_REPOSITORY)
    private readonly teamRepository: ITeamRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: SaveTeamCommand) {
    const { team } = command;
    const { id } = team;
    const teamEntity = await this.teamRepository.findById(id);

    if (teamEntity) {
      this.eventPublisher.mergeObjectContext(team);
      await this.teamRepository.save(team);
      team.commit();
    } else {
      // TODO обновлять, вместо создания
      this.eventPublisher.mergeObjectContext(team);
      await this.teamRepository.save(team);
      // TODO Комитить, только если успешно сохранилось
      team.commit();
    }
  }
}
