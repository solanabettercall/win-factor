import { Type } from 'class-transformer';
import { IMatchSet } from '../../interfaces/match-details/match-set.interface';
import { MatchEvent } from './events/match-event.model';
import { Score } from './score.model';
import { StartingLineup } from './starting-lineup.model';

export class MatchSet implements IMatchSet {
  @Type(() => Date)
  startTime: Date | null;
  @Type(() => Date)
  endTime: Date | null;
  @Type(() => Score)
  score: Score;
  duration: number;
  @Type(() => StartingLineup)
  startingLineup: StartingLineup;
  @Type(() => MatchEvent)
  events: MatchEvent[];
}
