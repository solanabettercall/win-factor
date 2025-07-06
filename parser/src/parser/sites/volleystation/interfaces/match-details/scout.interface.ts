import { CoinToss } from '../../models/match-details/coin-toss.model';
import { IMatchSet } from './match-set.interface';
import { IShortPlayer } from './short-player.interface';

export interface IScout {
  sets: IMatchSet[];
  interruptions: unknown[];
  objections: unknown[];
  coinToss: CoinToss;
  bestPlayer: IShortPlayer | null;
  ended: Date | null;
  mvp: IShortPlayer | null;
}
