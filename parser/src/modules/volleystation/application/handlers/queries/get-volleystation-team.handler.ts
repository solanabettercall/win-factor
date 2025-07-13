import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  IRawDetailedTeam,
  VolleystationTeamApiService,
} from 'src/modules/volleystation/infrastructure/volleystation-team.service';
import { GetVolleystationTeamQuery } from '../../queries/get-volleystation-team.query';

@QueryHandler(GetVolleystationTeamQuery)
export class GetVolleystationTeamQueryHandler
  implements IQueryHandler<GetVolleystationTeamQuery>
{
  constructor(
    private readonly volleystationTeamApiService: VolleystationTeamApiService,
  ) {}

  async execute(
    query: GetVolleystationTeamQuery,
  ): Promise<IRawDetailedTeam | null> {
    const { dto } = query;
    const rawDetailedTeam: IRawDetailedTeam | null =
      await this.volleystationTeamApiService.getTeam(dto);

    return rawDetailedTeam;
  }
}
