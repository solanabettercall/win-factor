import {
  IRawDetailedMatch,
  IRawMatch,
} from 'src/modules/volleystation/infrastructure/volleystation-match.service';
import { IMatch } from '../../domain/entities/match.entity';

export function mapRawToMatch(raw: IRawMatch): IMatch {
  return {
    id: raw.id,
    matchUrl: raw.matchUrl,
    away: null,
    home: null,
  };
}

export function mapRawDetailedToMatch(raw: IRawDetailedMatch): IMatch {
  return {
    id: raw.id,
    matchUrl: raw.url,
    away: null,
    home: null,
  };
}
