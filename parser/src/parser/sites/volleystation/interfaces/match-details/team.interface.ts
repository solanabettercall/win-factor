import { IPlayer } from './player.interface';
import { IStaff } from './staff.interface';

export interface ITeam {
  code: string;
  name: string;
  shortName: string;
  staff: IStaff[];
  captain: number;
  libero: number[];
  players: IPlayer[];
  reserve: IPlayer[];
  color: string;
  email: string;
}
