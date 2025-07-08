import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  IRawPlayer,
  VolleystationPlayerApiService,
} from 'src/modules/volleystation/infrastructure/volleystation-player.service';
import { GetVolleystationPlayersQuery } from '../../queries/get-volleystation-players.query';

@QueryHandler(GetVolleystationPlayersQuery)
export class GetVolleystationPlayersQueryHandler
  implements IQueryHandler<GetVolleystationPlayersQuery>
{
  constructor(
    private readonly volleystationPlayerApiService: VolleystationPlayerApiService,
  ) {}

  async execute(query: GetVolleystationPlayersQuery): Promise<IRawPlayer[]> {
    const { competition } = query;
    const competitionUrl = competition.getUrl();

    const rawPlayers: IRawPlayer[] =
      await this.volleystationPlayerApiService.getPlayers({
        competitionBaseUrl: competitionUrl,
      });

    return rawPlayers;
  }
}
