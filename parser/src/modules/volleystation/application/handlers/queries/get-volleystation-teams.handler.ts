import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { GetVolleystationTeamsQuery } from '../../queries/get-volleystation-teams.query';
import {
  IRawTeam,
  VolleystationTeamApiService,
} from 'src/modules/volleystation/infrastructure/volleystation-team.service';

@QueryHandler(GetVolleystationTeamsQuery)
export class GetVolleystationTeamsQueryHandler
  implements IQueryHandler<GetVolleystationTeamsQuery>
{
  constructor(
    private readonly volleystationTeamApiService: VolleystationTeamApiService,
  ) {}

  async execute(query: GetVolleystationTeamsQuery): Promise<IRawTeam[]> {
    const { competition } = query;
    const competitionUrl = competition.getUrl();

    const rawTeams: IRawTeam[] =
      await this.volleystationTeamApiService.getTeams({
        competitionBaseUrl: competitionUrl,
      });

    return rawTeams;
  }
}
