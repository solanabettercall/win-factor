import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  IRawDetailedMatch,
  VolleystationMatchApiService,
} from 'src/modules/volleystation/infrastructure/volleystation-match.service';
import { GetVolleystationMatchQuery } from '../../queries/get-volleystation-match.query';

@QueryHandler(GetVolleystationMatchQuery)
export class GetVolleystationMatchQueryHandler
  implements IQueryHandler<GetVolleystationMatchQuery>
{
  constructor(
    private readonly volleystationMatchApiService: VolleystationMatchApiService,
  ) {}

  async execute(
    query: GetVolleystationMatchQuery,
  ): Promise<IRawDetailedMatch | null> {
    const { dto } = query;

    const rawDetailedMatch: IRawDetailedMatch | null =
      await this.volleystationMatchApiService.getMatch(dto);

    return rawDetailedMatch;
  }
}
