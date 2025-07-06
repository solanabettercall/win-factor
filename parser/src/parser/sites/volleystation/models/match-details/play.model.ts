import { IPlay } from '../../interfaces/match-details/play.interface';

export class Play implements IPlay {
  team: 'home' | 'away';
  player: number;
  skill: string;
  effect: string;
}
