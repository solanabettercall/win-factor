import { Type } from 'class-transformer';
import { IScoutData } from '../../interfaces/match-details/scout-data.interface';
import { Play } from './play.model';
import { Score } from './score.model';

export class ScoutData implements IScoutData {
  point: string;
  @Type(() => Score)
  score: Score;
  @Type(() => Play)
  plays: Play[];
}
