import { ScoutData } from '../../models/match-details/scout-data.model';
import { IOfficials } from './officials.interface';
import { IScout } from './scout.interface';
import { ISettings } from './settings.interface';
import { ITeams } from './teams.interface';

export interface IPlayByPlayEvent {
  id: string;
  /**
   * UTC-0
   */
  startDate: Date;
  teams: ITeams;
  city: string;
  country: string;
  hall: string;
  phase: string;
  round: number;
  competition: string;
  remarks: string;
  matchNumber: string;
  division: string;
  category: string;
  officials: IOfficials;
  scout: IScout;
  settings: ISettings;
  version: number;
  workTeam: unknown;
  matchId: number;
  scoutData: ScoutData[][];
}
