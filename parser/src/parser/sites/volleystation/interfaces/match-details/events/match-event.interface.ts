import { ILiberoEvent } from './libero-event.interface';
import { IRallyEvent } from './rally-event.interface';
import { ISubstitutionEvent } from './substitution-event.interface';
import { ITimeoutEvent } from './timeout-event.interface';

export interface IMatchEvent {
  libero: ILiberoEvent | null;
  rally: IRallyEvent | null;
  timeout: ITimeoutEvent | null;
  substitution: ISubstitutionEvent | null;
}
