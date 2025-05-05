import { IPlayerSummaryStatistics } from '../../interfaces/player-profile/player-summary-statistics.interface';

export class PlayerSummaryStatistics implements IPlayerSummaryStatistics {
  matchesPlayed: number;
  setsPlayed: number;
  pointsScored: number;
  numberOfAces: number;
  pointsByBlock: number;
}
