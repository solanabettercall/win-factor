import { Query } from '@nestjs/cqrs';
import { Match } from '../../domain/entities/match.entity';
import { MatchId } from '../../domain/value-objects/match-id.vo';

export class GetMatchQuery extends Query<Match | null> {
  constructor(public readonly id: MatchId) {
    super();
  }
}
