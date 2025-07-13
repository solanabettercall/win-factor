import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { SavePlayerCommand } from '../../commands/save-player.command';
import {
  PLAYER_REPOSITORY,
  IPlayerRepository,
} from 'src/modules/monitoring/domain/repositories/player.repository.interface';

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
    const { player } = command;

    const { id } = player;
    const playerEntity = await this.playerRepository.findById(id);

    if (playerEntity) {
      this.eventPublisher.mergeObjectContext(player);
      await this.playerRepository.save(player);
      player.commit();
    } else {
      // TODO обновлять, вместо создания
      this.eventPublisher.mergeObjectContext(player);
      await this.playerRepository.save(player);
      // TODO Комитить, только если успешно сохранилось
      player.commit();
    }
  }
}
