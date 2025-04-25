import { IMatchInfo } from '../interfaces/match-info.interface';
import { CompetitionInfo } from './competition-info.entity';
import { PhaseInfo } from './phase-info.entity';
import { SeasonInfo } from './season-info.entity';
import { StadiumInfo } from './stadium-info.entity';
import { TeamInfo } from './team-info.entity';

export class MatchInfo implements IMatchInfo {
  id: number;
  date: Date;
  dateUtc: Date;

  season: SeasonInfo;
  competition: CompetitionInfo;
  stadium: StadiumInfo;
  home: TeamInfo;
  guest: TeamInfo;

  phase: PhaseInfo;

  pointsHome: number;
  pointsGuest: number;
  wonSetHome: number;
  wonSetGuest: number;
  finalized: boolean;
  status: number;
  maleNotFemale: boolean;
  theme: string;
  matchCentreUrl: string;

  constructor(data: MatchInfo) {
    Object.assign(this, {
      ...data,
      season: new SeasonInfo(data.season),
      competition: new CompetitionInfo(data.competition),
      stadium: new StadiumInfo(data.stadium),
      home: new TeamInfo(data.home),
      guest: new TeamInfo(data.guest),
      phase: new PhaseInfo(data.phase),
    });
  }
}
