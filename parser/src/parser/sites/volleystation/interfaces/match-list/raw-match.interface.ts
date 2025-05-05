import { IRawTeam } from './raw-team.interface';

export interface IRawMatch {
  date: Date;
  id: number;
  matchUrl: string;
  home: IRawTeam;
  away: IRawTeam;
}
