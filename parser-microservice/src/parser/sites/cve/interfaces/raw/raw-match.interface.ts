interface ICalendarDate {
  ShortDay: string;
  DayNumber: number;
  ShortMonth: string;
  Year: number;
  Matches: IRawMatch[];
  MatchCentreUrl: string;
  Date: string;
  IsPadding: boolean;
  Theme: string;
}

export interface IGetCalendarResponse {
  SelectedMonth: string;
  SelectedMonthName: string;
  PaddingDaysForSquareness: number;
  Heading: string;
  Theme: string;
  Ident: number;
  Dates: ICalendarDate[];
}

export interface IRawMatch {
  MatchID: number;
  MatchDateTime: string;
  MatchDateTime_UTC: string;
  SeasonID: number;
  CompetitionID: number;
  CompetitionName: string;
  CompetitionLogo?: string;
  StadiumName?: string;
  StadiumCity?: string;
  StadiumCountry?: string;
  HomeTeamName: string;
  HomeClubCode?: string;
  HomeTeamNationID?: string;
  HomeTeamLogo?: string;
  GuestTeamName: string;
  GuestClubCode?: string;
  GuestTeamNationID?: string;
  GuestTeamLogo?: string;
  PhaseId?: number;
  PhaseName?: string;
  PointsHome?: number;
  PointsGuest?: number;
  WonSetHome?: number;
  WonSetGuest?: number;
  Finalized: boolean;
  Status: number;
  MaleNotFemale: boolean;
  Theme?: string;
  MatchCentreUrl?: string;
}
