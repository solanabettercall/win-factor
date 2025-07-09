import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { GetVolleystationCompetitionQuery } from '../../queries/get-volleystation-competition.query';
import {
  IRawComptition,
  VolleystationCompetitionApiService,
} from 'src/modules/volleystation/infrastructure/volleystation-competition.service';
import { GetVolleystationMatchesQuery } from '../../queries/get-volleystation-matches.query';
import {
  IRawMatch,
  MatchListType,
  VolleystationMatchApiService,
} from 'src/modules/volleystation/infrastructure/volleystation-match.service';

@QueryHandler(GetVolleystationMatchesQuery)
export class GetVolleystationMatchesQueryHandler
  implements IQueryHandler<GetVolleystationMatchesQuery>
{
  constructor(
    private readonly volleystationMatchApiService: VolleystationMatchApiService,
  ) {}

  async execute(query: GetVolleystationMatchesQuery): Promise<IRawMatch[]> {
    const { competition } = query;

    // TODO: Сделать потоком параллельным потоком с rxjs
    const resultMatches: IRawMatch[] =
      await this.volleystationMatchApiService.getMatches({
        competitionBaseUrl: competition.getUrl(),
        type: MatchListType.Results,
      });

    const scheduleMatches: IRawMatch[] =
      await this.volleystationMatchApiService.getMatches({
        competitionBaseUrl: competition.getUrl(),
        type: MatchListType.Schedule,
      });

    return [...resultMatches, ...scheduleMatches];
  }
}
