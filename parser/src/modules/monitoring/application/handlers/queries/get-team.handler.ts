import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetTeamQuery } from '../../queries/get-team.query';
import {
  ITeamRepository,
  TEAM_REPOSITORY,
} from 'src/modules/monitoring/domain/repositories/team.repository.interface';
import { Team } from 'src/modules/monitoring/domain/entities/team.entity';

@QueryHandler(GetTeamQuery)
export class GetTeamQueryHandler implements IQueryHandler<GetTeamQuery> {
  constructor(
    @Inject(TEAM_REPOSITORY)
    private readonly teamRepository: ITeamRepository,
  ) {}

  execute(query: GetTeamQuery): Promise<Team | null> {
    const { id } = query;
    return this.teamRepository.findById(id);
  }
}
