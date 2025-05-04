import { ICoinTossStart } from '../../interfaces/match-details/coin-toss-start.interface';

export class CoinTossStart implements ICoinTossStart {
  start: string;
  leftSide: string;
  winner: string;
}
