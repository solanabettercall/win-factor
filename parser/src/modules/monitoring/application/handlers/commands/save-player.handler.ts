import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { SavePlayerCommand } from '../../commands/save-player.command';
import {
  PLAYER_REPOSITORY,
  IPlayerRepository,
} from 'src/modules/monitoring/domain/repositories/player.repository.interface';
import { Player } from 'src/modules/monitoring/domain/entities/player.entity';

@CommandHandler(SavePlayerCommand)
export class SavePlayerCommandHandler
  implements ICommandHandler<SavePlayerCommand>
{
  constructor(
    @Inject(PLAYER_REPOSITORY)
    private readonly playerRepository: IPlayerRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: SavePlayerCommand) {
    const { props } = command;

    const { id } = props;
    const playerEntity = await this.playerRepository.findById(id);

    if (playerEntity) {
      const player = Player.create(props);
      this.eventPublisher.mergeObjectContext(player);
      await this.playerRepository.save(player);
      player.commit();
    } else {
      // TODO обновлять, вместо создания
      const player = Player.create(props);
      this.eventPublisher.mergeObjectContext(player);
      await this.playerRepository.save(player);
      // TODO Комитить, только если успешно сохранилось
      player.commit();
    }
  }
}
