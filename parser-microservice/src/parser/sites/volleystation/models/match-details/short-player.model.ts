import { IShortPlayer } from '../../interfaces/match-details/short-player.interface';

export class ShortPlayer implements IShortPlayer {
  number: number;
  team: 'home' | 'away';
}
