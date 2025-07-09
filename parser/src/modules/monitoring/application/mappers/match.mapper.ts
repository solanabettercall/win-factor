import { ICompetition } from '../../domain/entities/competition.entity';
import { IRawComptition } from 'src/modules/volleystation/infrastructure/volleystation-competition.service';
import { CompetitionId } from '../../domain/value-objects/competition-id.vo';
import { IRawMatch } from 'src/modules/volleystation/infrastructure/volleystation-match.service';
import { IMatch, Match } from '../../domain/entities/match.entity';
import { MatchId } from '../../domain/value-objects/match-id.vo';
import { match } from 'assert';
import { Team } from '../../domain/entities/team.entity';

export function mapRawToMatch(raw: IRawMatch): IMatch {
  return {
    id: MatchId.create(raw.id),
    matchUrl: raw.matchUrl,
    away: null,
    home: null,
  };
}
