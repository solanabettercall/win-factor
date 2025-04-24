import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';

interface TeamInfo {
  TeamName: string;
  ClubCode: string;
  NationID: string;
  TeamLogo: string;
}

interface StadiumInfo {
  name: string;
  city: string;
  country: string;
}

interface CompetitionInfo {
  id: string;
  name: string;
  competitionLogo: string;
}

interface SeasonInfo {
  id: string;
}

interface PhaseInfo {
  id: number;
  name: string;
}

export interface MatchInfo {
  id: number;
  date: string;
  dateUtc: string;

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
}

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  private readonly CALENDAR_URL =
    'https://www.cev.eu/umbraco/api/CalendarApi/GetCalendar?nodeId=11346&culture=en-US';

  constructor(private readonly httpService: HttpService) {}

  public async getCalendar(): Promise<MatchInfo[]> {
    const response: AxiosResponse = await firstValueFrom(
      this.httpService.get(this.CALENDAR_URL),
    );
    const rawMatches = response.data['Dates']?.flatMap((d) => d.Matches) || [];

    return rawMatches.map(
      (match): MatchInfo => ({
        id: match.MatchID,
        date: match.MatchDateTime,
        dateUtc: match.MatchDateTime_UTC,
        season: { id: match.SeasonID },
        competition: {
          id: match.CompetitionID,
          name: match.CompetitionName,
          competitionLogo: match.CompetitionLogo,
        },
        stadium: {
          name: match.StadiumName,
          city: match.StadiumCity,
          country: match.StadiumCountry,
        },
        home: {
          TeamName: match.HomeTeamName,
          ClubCode: match.HomeClubCode,
          NationID: match.HomeTeamNationID,
          TeamLogo: match.HomeTeamLogo,
        },
        guest: {
          TeamName: match.GuestTeamName,
          ClubCode: match.GuestClubCode,
          NationID: match.GuestTeamNationID,
          TeamLogo: match.GuestTeamLogo,
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

        matchCentreUrl: match.MatchCentreUrl,
      }),
    );
  }
}
