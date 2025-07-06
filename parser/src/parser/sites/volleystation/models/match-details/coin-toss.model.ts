import { Type } from 'class-transformer';
import { ICoinToss } from '../../interfaces/match-details/coin-toss.interface';
import { CoinTossStart } from './coin-toss-start.model';

export class CoinToss implements ICoinToss {
  @Type(() => CoinTossStart)
  start: CoinTossStart;
}
