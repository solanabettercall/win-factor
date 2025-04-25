import { ICompetitionInfo } from './competition-info.interface';
import { IPhaseInfo } from './phase-info.interface.ts';
import { ISeasonInfo } from './season-info.interface.ts';
import { IStadiumInfo } from './stadium-info.interface.ts';
import { ITeamInfo } from './team-info.interface.ts';

export interface IMatchInfo {
  id: number;
  date: Date;
  dateUtc: Date;

  season: ISeasonInfo;
  competition: ICompetitionInfo;
  stadium: IStadiumInfo;
  home: ITeamInfo;
  guest: ITeamInfo;

  phase: IPhaseInfo;

  pointsHome: number;
  pointsGuest: number;
  wonSetHome: number;
  wonSetGuest: number;
  finalized: boolean;
  status: number;
  maleNotFemale: boolean;
  theme: string;
  matchCentreUrl: string;
}
