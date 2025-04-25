import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import {
  firstValueFrom,
  from as rxjsFrom,
  mergeMap,
  toArray,
  lastValueFrom,
  Observable,
  filter,
} from 'rxjs';
import { IMatchInfo } from './interfaces/match-info.interface';
import { MatchInfo } from './entities/match-info.entity';
import * as UrlParse from 'url-parse';

import {
  addYears,
  eachMonthOfInterval,
  format,
  isAfter,
  isBefore,
  isWithinInterval,
} from 'date-fns';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  private readonly CALENDAR_URL =
    'https://www.cev.eu/umbraco/api/CalendarApi/GetCalendar';

  private readonly BASE_DOMAIN = 'cev.eu';
  private readonly MIN_DATE = new Date(1948, 8, 1); // Сентябрь 1948
  private readonly MAX_DATE = addYears(new Date(), 1);
  private readonly CONCURRENCY_LIMIT = 5;

  constructor(private readonly httpService: HttpService) {}

  private normalizeUrl(url: string) {
    const normalizedUrl = UrlParse(url);
    normalizedUrl.set('host', this.BASE_DOMAIN);
    normalizedUrl.set('hostname', this.BASE_DOMAIN);
    normalizedUrl.set('protocol', 'https:');
    return normalizedUrl.href;
  }

  public async getMatchesInRange(from: Date, to: Date): Promise<MatchInfo[]> {
    // Гарантируем границы
    from = isBefore(from, this.MIN_DATE) ? this.MIN_DATE : from;
    to = isAfter(to, this.MAX_DATE) ? this.MAX_DATE : to;

    if (isAfter(from, to)) {
      const errMessage = `Дата начала (${from}) не может быть позже даты конца (${to})`;
      this.logger.warn(errMessage);
      throw new BadRequestException(errMessage);
    }

    const months = eachMonthOfInterval({ start: from, end: to });

    // Запрашиваем данные по каждому месяцу параллельно
    const allMatches$: Observable<IMatchInfo[]> = rxjsFrom(months).pipe(
      mergeMap(
        (monthDate) => this.getMatchesByYearMonth(monthDate),
        this.CONCURRENCY_LIMIT,
      ),
      mergeMap((matches) => matches),
      filter((match) => isWithinInterval(match.date, { start: from, end: to })),
      toArray(),
    );

    const allMatches: IMatchInfo[] = await lastValueFrom(allMatches$);

    return allMatches;
  }

  public async getMatchesByYearMonth(date: Date): Promise<IMatchInfo[]> {
    this.logger.verbose(
      `start getMatchesByYearMonth() ${format(date, 'dd.MM.yyyy')}`,
    );
    const formatedDate = format(date, 'yyyy-MM-dd');

    const response: AxiosResponse = await firstValueFrom(
      this.httpService.get(this.CALENDAR_URL, {
        params: {
          nodeId: 11346,
          culture: 'en-US',
          date: formatedDate,
        },
      }),
    );
    const rawMatches = response.data['Dates']?.flatMap((d) => d.Matches) || [];

    this.logger.verbose(
      `end getMatchesByYearMonth() ${format(date, 'dd.MM.yyyy')}`,
    );
    return rawMatches.map(
      (match): MatchInfo =>
        new MatchInfo({
          id: match.MatchID,
          date: new Date(match.MatchDateTime),
          dateUtc: new Date(match.MatchDateTime_UTC),
          season: { id: match.SeasonID },
          competition: {
            id: match.CompetitionID,
            name: match.CompetitionName,
            logoUrl: match.CompetitionLogo,
          },
          stadium: {
            name: match.StadiumName,
            city: match.StadiumCity,
            country: match.StadiumCountry,
          },
          home: {
            name: match.HomeTeamName,
            clubCode: match.HomeClubCode,
            nationId: match.HomeTeamNationID,
            logoUrl: match.HomeTeamLogo,
          },
          guest: {
            name: match.GuestTeamName,
            clubCode: match.GuestClubCode,
            nationId: match.GuestTeamNationID,
            logoUrl: match.GuestTeamLogo,
          },
          phase: { id: match.PhaseId, name: match.PhaseName },
          pointsHome: match.PointsHome,
          pointsGuest: match.PointsGuest,
          wonSetHome: match.WonSetHome,
          wonSetGuest: match.WonSetGuest,
          finalized: match.Finalized,
          status: match.Status,
          maleNotFemale: match.MaleNotFemale,
          theme: match.Theme,

          matchCentreUrl: this.normalizeUrl(match.MatchCentreUrl),
        }),
    );
  }
}
