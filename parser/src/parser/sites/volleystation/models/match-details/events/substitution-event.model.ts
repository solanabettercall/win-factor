import { Type } from 'class-transformer';
import { ISubstitutionEvent } from '../../../interfaces/match-details/events/substitution-event.interface';

export class SubstitutionEvent implements ISubstitutionEvent {
  team: 'home' | 'away';
  @Type(() => Date)
  time: Date;
  in: number;
  out: number;
}
