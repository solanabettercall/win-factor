import { MatchId } from '../value-objects/match-id.vo';
import { PlayerId } from '../value-objects/player-id.vo';

export interface ITeamStartingLineup {
  homeTeam: PlayerId[];
  awayTeam: PlayerId[];
}

export interface IMatchStartingLineupRepository {
  saveStartingLineup(matchId: MatchId, setNumber: number, playerIds: PlayerId[]): Promise<void>;
  getStartingLineupForSet(matchId: MatchId, setNumber: number): Promise<ITeamStartingLineup>;
  clearStartingLineup(matchId: MatchId, setNumber: number): Promise<void>;
}
