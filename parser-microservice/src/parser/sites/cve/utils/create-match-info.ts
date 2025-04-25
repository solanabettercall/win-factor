import { MatchInfo } from '../entities/match-info.entity';
import { IMatchInfo } from '../interfaces/match-info.interface';
import { IRawMatch } from '../interfaces/raw/raw-match.interface';
import { normalizeUrl } from './normalize-url';

export function createMatchInfo(raw: IRawMatch): IMatchInfo {
  return new MatchInfo({
    id: raw.MatchID,
    date: new Date(raw.MatchDateTime),
    dateUtc: new Date(raw.MatchDateTime_UTC),
    season: { id: raw.SeasonID },
    competition: {
      id: raw.CompetitionID,
      name: raw.CompetitionName,
      logoUrl: raw.CompetitionLogo,
    },
    stadium: {
      name: raw.StadiumName,
      city: raw.StadiumCity,
      country: raw.StadiumCountry,
    },
    home: {
      name: raw.HomeTeamName,
      clubCode: raw.HomeClubCode,
      nationId: raw.HomeTeamNationID,
      logoUrl: raw.HomeTeamLogo,
    },
    guest: {
      name: raw.GuestTeamName,
      clubCode: raw.GuestClubCode,
      nationId: raw.GuestTeamNationID,
      logoUrl: raw.GuestTeamLogo,
    },
    phase: { id: raw.PhaseId, name: raw.PhaseName },
    pointsHome: raw.PointsHome,
    pointsGuest: raw.PointsGuest,
    wonSetHome: raw.WonSetHome,
    wonSetGuest: raw.WonSetGuest,
    finalized: raw.Finalized,
    status: raw.Status,
    maleNotFemale: raw.MaleNotFemale,
    theme: raw.Theme,
    matchCentreUrl: normalizeUrl(raw.MatchCentreUrl),
  });
}
