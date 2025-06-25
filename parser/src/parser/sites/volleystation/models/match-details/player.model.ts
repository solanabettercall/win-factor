import { IPlayer } from '../../interfaces/match-details/player.interface';

export class Player implements IPlayer {
  code: string;
  firstName: string;
  lastName: string;
  isForeign?: boolean;
  isDisabled?: boolean;
  isConfederation?: boolean;
  shirtNumber: number;
  position: number;
  shirtName: string;
}
