import { Match } from '../entities/match.entity';
import { MatchId } from '../value-objects/match-id.vo';

export const MATCH_REPOSITORY = 'IMatchRepository';

export interface IMatchRepository {
  findById(id: MatchId): Promise<Match | null>;
  save(match: Match): Promise<void>;
}
