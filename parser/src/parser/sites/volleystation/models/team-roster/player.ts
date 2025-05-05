import { IPlayer } from '../../interfaces/team-roster/player.interface';

/**
 * Информация об игроке.
 */
export class Player implements IPlayer {
  id!: number;
  name!: string;
  position!: string;
  number!: number;
  url!: string;
  photoUrl!: string | null;
}
