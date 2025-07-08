import { Query } from '@nestjs/cqrs';
import { IRawTeam } from '../../infrastructure/volleystation-team.service';
import { Competition } from 'src/modules/monitoring/domain/entities/competition.entity';

export class GetVolleystationTeamsQuery extends Query<IRawTeam[]> {
  constructor(public readonly competition: Competition) {
    super();
  }
}
