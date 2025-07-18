import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { GetVolleystationLiveMatchQuery } from '../../queries/get-volleystation-live-match.query';
import {
  IPlayByPlayEvent,
  VolleystationLiveMatchApiService,
} from 'src/modules/volleystation/infrastructure/volleystation-live-match.service';

@QueryHandler(GetVolleystationLiveMatchQuery)
export class GetVolleystationLiveMatchQueryHandler
  implements IQueryHandler<GetVolleystationLiveMatchQuery>
{
  constructor(
    private readonly volleystationLiveMatchApiService: VolleystationLiveMatchApiService,
  ) {}

  async execute(
    query: GetVolleystationLiveMatchQuery,
  ): Promise<IPlayByPlayEvent | null> {
    const { matchId } = query;

    const playByPlayEvent: IPlayByPlayEvent | null =
      await this.volleystationLiveMatchApiService.getMatchInfo(matchId);

    return playByPlayEvent;
  }
}
