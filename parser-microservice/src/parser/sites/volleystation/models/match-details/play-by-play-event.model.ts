import { Expose, Type } from 'class-transformer';
import { IPlayByPlayEvent } from '../../interfaces/match-details/play-by-play-event.interface';
import { Officials } from './officials.model';
import { ScoutData } from './scout-data.model';
import { Scout } from './scout.model';
import { Settings } from './settings.model';
import { Teams } from './teams.model';

export class PlayByPlayEvent implements IPlayByPlayEvent {
  @Expose({ name: '_id' })
  id: string;
  @Type(() => Date)
  startDate: Date;
  @Type(() => Teams)
  teams: Teams;
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
  @Type(() => Officials)
  officials: Officials;
  @Type(() => Scout)
  scout: Scout;
  @Type(() => Settings)
  settings: Settings;
  version: number;
  workTeam: unknown;
  matchId: number;

  @Type(() => ScoutData)
  scoutData: ScoutData[][];
}
