import { IPlay } from './play.interface';
import { IScore } from './score.interface';

export interface IScoutData {
  point: string;
  score: IScore;
  plays: IPlay[];
}
