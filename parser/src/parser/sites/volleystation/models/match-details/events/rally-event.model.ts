import { Type } from 'class-transformer';
import { IRallyEvent } from '../../../interfaces/match-details/events/rally-event.interface';

export class RallyEvent implements IRallyEvent {
  point: 'home' | 'away';
  @Type(() => Date)
  startTime: Date;
  @Type(() => Date)
  endTime: Date;
}
