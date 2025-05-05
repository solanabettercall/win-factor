import { IMatchEvent } from './events/match-event.interface';
import { IScore } from './score.interface';
import { IStartingLineup } from './starting-lineup.interface';

export interface IMatchSet {
  startTime: Date | null;
  endTime: Date | null;
  score: IScore;
  duration: number;
  startingLineup: IStartingLineup;
  events: IMatchEvent[];
}
