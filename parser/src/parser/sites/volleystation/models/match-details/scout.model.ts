import { Type } from 'class-transformer';
import { IScout } from '../../interfaces/match-details/scout.interface';
import { CoinToss } from './coin-toss.model';
import { MatchSet } from './match-set.model';
import { ShortPlayer } from './short-player.model';

export class Scout implements IScout {
  @Type(() => ShortPlayer)
  bestPlayer: ShortPlayer | null;
  @Type(() => Date)
  ended: Date | null;
  @Type(() => ShortPlayer)
  mvp: ShortPlayer | null;
  @Type(() => CoinToss)
  coinToss: CoinToss;
  @Type(() => MatchSet)
  sets: MatchSet[];
  interruptions: unknown[];
  objections: unknown[];
}
