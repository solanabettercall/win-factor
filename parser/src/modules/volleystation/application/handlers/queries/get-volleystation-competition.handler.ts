import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { GetVolleystationCompetitionQuery } from '../../queries/get-volleystation-competition.query';
import {
  IRawComptition,
  VolleystationCompetitionApiService,
} from 'src/modules/volleystation/infrastructure/volleystation-competition.service';

@QueryHandler(GetVolleystationCompetitionQuery)
export class GetVolleystationCompetitionQueryHandler
  implements IQueryHandler<GetVolleystationCompetitionQuery>
{
  constructor(
    private readonly volleystationCompetition: VolleystationCompetitionApiService,
  ) {}

  async execute(
    query: GetVolleystationCompetitionQuery,
  ): Promise<IRawComptition | null> {
    const { id } = query;

    const competitionV1: IRawComptition | null =
      await this.volleystationCompetition.getCompetition({
        id: id.value,
        version: 'website',
      });

    if (competitionV1) {
      return competitionV1;
    }

    const competitionV2: IRawComptition | null =
      await this.volleystationCompetition.getCompetition({
        id: id.value,
        version: 'website2',
      });

    return competitionV2;
  }
}
