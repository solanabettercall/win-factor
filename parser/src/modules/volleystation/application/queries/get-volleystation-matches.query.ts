import { Query } from '@nestjs/cqrs';
import { IRawMatch } from '../../infrastructure/volleystation-match.service';
import { Competition } from 'src/modules/monitoring/domain/entities/competition.entity';

export class GetVolleystationMatchesQuery extends Query<IRawMatch[]> {
  constructor(public readonly competition: Competition) {
    super();
  }
}
