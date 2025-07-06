import { ILiberoEvent } from '../../../interfaces/match-details/events/libero-event.interface';

export class LiberoEvent implements ILiberoEvent {
  team: 'home' | 'away';
  enters: boolean;
  time: string;
  libero: number;
  player: number;
}
