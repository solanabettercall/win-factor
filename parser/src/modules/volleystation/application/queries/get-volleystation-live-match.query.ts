import { Query } from '@nestjs/cqrs';
import { IPlayByPlayEvent } from '../../infrastructure/volleystation-live-match.service';
import { MatchId } from 'src/modules/monitoring/domain/value-objects/match-id.vo';

export class GetVolleystationLiveMatchQuery extends Query<IPlayByPlayEvent | null> {
  constructor(public readonly matchId: MatchId) {
    super();
  }
}
