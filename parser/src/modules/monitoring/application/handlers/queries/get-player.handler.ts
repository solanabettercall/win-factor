import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetPlayerQuery } from '../../queries/get-player.query';
import {
  IPlayerRepository,
  PLAYER_REPOSITORY,
} from 'src/modules/monitoring/domain/repositories/player.repository.interface';
import { Player } from 'src/modules/monitoring/domain/entities/player.entity';

@QueryHandler(GetPlayerQuery)
export class GetPlayerQueryHandler implements IQueryHandler<GetPlayerQuery> {
  constructor(
    @Inject(PLAYER_REPOSITORY)
    private readonly playerRepository: IPlayerRepository,
  ) {}

  execute(query: GetPlayerQuery): Promise<Player | null> {
    const { id } = query;
    return this.playerRepository.findById(id);
  }
}
