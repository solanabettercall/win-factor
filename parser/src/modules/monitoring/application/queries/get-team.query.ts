import { Query } from '@nestjs/cqrs';
import { Team } from '../../domain/entities/team.entity';
import { TeamId } from '../../domain/value-objects/team-id.vo';

export class GetTeamQuery extends Query<Team | null> {
  constructor(public readonly id: TeamId) {
    super();
  }
}
