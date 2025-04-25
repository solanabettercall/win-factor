import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import { IMatchInfo } from './interfaces/match-info.interface';
import { MatchInfo } from './entities/match-info.entity';
import * as UrlParse from 'url-parse';
import * as moment from 'moment';
@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  private readonly CALENDAR_URL =
    'https://www.cev.eu/umbraco/api/CalendarApi/GetCalendar';

  private readonly BASE_DOMAIN = 'cev.eu';

  constructor(private readonly httpService: HttpService) {}

  private normalizeUrl(url: string) {
    const normalizedUrl = UrlParse(url);
    normalizedUrl.set('host', this.BASE_DOMAIN);
    normalizedUrl.set('hostname', this.BASE_DOMAIN);
    normalizedUrl.set('protocol', 'https:');
    return normalizedUrl.href;
  }

  public async getCalendarByYearMonth(date: Date): Promise<IMatchInfo[]> {
    const momentDate = moment(date).day(1).format('YYYY-MM-DD');

    const response: AxiosResponse = await firstValueFrom(
      this.httpService.get(this.CALENDAR_URL, {
        params: {
          nodeId: 11346,
          culture: 'en-US',
          date: momentDate,
        },
      }),
    );
    const rawMatches = response.data['Dates']?.flatMap((d) => d.Matches) || [];

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
