import { IScore } from '../../interfaces/match-details/score.interface';

export class Score implements IScore {
  home: number;
  away: number;
}
