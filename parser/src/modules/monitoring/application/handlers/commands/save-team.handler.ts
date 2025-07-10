import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { SaveTeamCommand } from '../../commands/save-team.command';
import {
  ITeamRepository,
  TEAM_REPOSITORY,
} from 'src/modules/monitoring/domain/repositories/team.repository.interface';
import { Team } from 'src/modules/monitoring/domain/entities/team.entity';

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
    const { props } = command;
    const { id } = props;
    const teamEntity = await this.teamRepository.findById(id);

    if (teamEntity) {
      const team = Team.create(props);
      this.eventPublisher.mergeObjectContext(team);
      await this.teamRepository.save(team);
      team.commit();
    } else {
      // TODO обновлять, вместо создания
      const team = Team.create(props);
      this.eventPublisher.mergeObjectContext(team);
      await this.teamRepository.save(team);
      // TODO Комитить, только если успешно сохранилось
      team.commit();
    }
  }
}
