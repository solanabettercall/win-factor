import { Expose, Transform, Type } from 'class-transformer';
import { IPlayByPlayEvent } from '../../interfaces/match-details/play-by-play-event.interface';
import { Officials } from './officials.model';
import { ScoutData } from './scout-data.model';
import { Scout } from './scout.model';
import { Settings } from './settings.model';
import { Teams } from './teams.model';
import { isBefore, addMinutes, addHours } from 'date-fns';
import { MatchStatus } from '../../enums';
import { Logger } from '@nestjs/common';

export class PlayByPlayEvent implements IPlayByPlayEvent {
  @Expose({ name: '_id' })
  id: string;

  @Transform(({ value }) => value.getTime(), { toPlainOnly: true })
  @Transform(({ value }) => new Date(value), { toClassOnly: true })
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

  get status(): MatchStatus {
    const now = new Date();
    const start = this.startDate;

    const isCompletedMatch = isBefore(addHours(start, 3), now);
    const isScheduledMatch = isBefore(now, addMinutes(start, -30));
    const isOnlineMatch =
      isBefore(addMinutes(start, -30), now) &&
      isBefore(now, addHours(start, 3));

    switch (true) {
      case isCompletedMatch:
        return MatchStatus.Finished; // Завершённый матч
      case isOnlineMatch:
        return MatchStatus.Live; // Онлайн матч
      case isScheduledMatch:
        return MatchStatus.Upcoming; // Запланированный матч
      default:
        Logger.warn(`Неизвестный статус матча`, this);
        return MatchStatus.Finished; // Неизвестный статус, по умолчанию можно считать завершенным
    }
  }
}
