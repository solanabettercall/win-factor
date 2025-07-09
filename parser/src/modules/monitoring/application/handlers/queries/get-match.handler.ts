import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetMatchQuery } from '../../queries/get-match.query';
import {
  IMatchRepository,
  MATCH_REPOSITORY,
} from 'src/modules/monitoring/domain/repositories/match.repository.interface';
import { Match } from 'src/modules/monitoring/domain/entities/match.entity';

@QueryHandler(GetMatchQuery)
export class GetMatchQueryHandler implements IQueryHandler<GetMatchQuery> {
  constructor(
    @Inject(MATCH_REPOSITORY)
    private readonly matchRepository: IMatchRepository,
  ) {}

  execute(query: GetMatchQuery): Promise<Match | null> {
    const { id } = query;
    return this.matchRepository.findById(id);
  }
}
