import { IPlayer } from '../../interfaces/match-details/player.interface';

export class Player implements IPlayer {
  code: number;
  firstName: string;
  lastName: string;
  isForeign: boolean;
  isDisabled: boolean;
  isConfederation: boolean;
  shirtNumber: number;
}
