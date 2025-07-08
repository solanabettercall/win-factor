import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetCompetitionQuery } from '../../queries/get-competition.query';
import { Inject } from '@nestjs/common';
import {
  COMPETITION_REPOSITORY,
  ICompetitionRepository,
} from '../../../domain/repositories/competition.repository.interface';
import { Competition } from '../../../domain/entities/competition.entity';

@QueryHandler(GetCompetitionQuery)
export class GetCompetitionQueryHandler
  implements IQueryHandler<GetCompetitionQuery>
{
  constructor(
    @Inject(COMPETITION_REPOSITORY)
    private readonly competitionRepository: ICompetitionRepository,
  ) {}

  execute(query: GetCompetitionQuery): Promise<Competition | null> {
    const { id } = query;
    return this.competitionRepository.findById(id);
  }
}
