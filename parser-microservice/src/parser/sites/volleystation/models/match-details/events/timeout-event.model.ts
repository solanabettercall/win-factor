import { Type } from 'class-transformer';
import { ITimeoutEvent } from '../../../interfaces/match-details/events/timeout-event.interface';

export class TimeoutEvent implements ITimeoutEvent {
  team: 'home' | 'away';
  @Type(() => Date)
  time: Date;
}
