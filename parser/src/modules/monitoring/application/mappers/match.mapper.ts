import {
  IRawDetailedMatch,
  IRawMatch,
} from 'src/modules/volleystation/infrastructure/volleystation-match.service';
import { IMatchProps } from '../../domain/entities/match.entity';

export function mapRawToMatch(raw: IRawMatch): IMatchProps {
  return {
    id: raw.id,
    matchUrl: raw.matchUrl,
  };
}

export function mapRawDetailedToMatch(raw: IRawDetailedMatch): IMatchProps {
  return {
    id: raw.id,
    matchUrl: raw.url,
  };
}
