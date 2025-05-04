import { Type } from 'class-transformer';
import { IMatchEvent } from '../../../interfaces/match-details/events/match-event.interface';
import { LiberoEvent } from './libero-event.model';
import { RallyEvent } from './rally-event.model';
import { SubstitutionEvent } from './substitution-event.model';
import { TimeoutEvent } from './timeout-event.model';

export class MatchEvent implements IMatchEvent {
  @Type(() => LiberoEvent)
  libero: LiberoEvent | null;
  @Type(() => RallyEvent)
  rally: RallyEvent | null;
  @Type(() => TimeoutEvent)
  timeout: TimeoutEvent | null;
  @Type(() => SubstitutionEvent)
  substitution: SubstitutionEvent | null;
}
