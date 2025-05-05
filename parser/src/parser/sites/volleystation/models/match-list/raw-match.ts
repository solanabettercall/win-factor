import { Type } from 'class-transformer';
import { IRawMatch } from '../../interfaces/match-list/raw-match.interface';
import { RawTeam } from './raw-team';

export class RawMatch implements IRawMatch {
  @Type(() => Date)
  date: Date;
  id: number;
  matchUrl: string;
  @Type(() => RawTeam)
  home: RawTeam;
  @Type(() => RawTeam)
  away: RawTeam;
}
