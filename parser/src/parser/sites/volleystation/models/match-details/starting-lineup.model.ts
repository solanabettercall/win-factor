import { IStartingLineup } from '../../interfaces/match-details/starting-lineup.interface';

export class StartingLineup implements IStartingLineup {
  home: number[];
  away: number[];
}
