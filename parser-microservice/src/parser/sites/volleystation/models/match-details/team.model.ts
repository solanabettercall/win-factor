import { Type } from 'class-transformer';
import { ITeam } from '../../interfaces/match-details/team.interface';
import { Player } from './player.model';
import { Staff } from './staff.model';

export class Team implements ITeam {
  code: string;
  name: string;
  shortName: string;
  @Type(() => Staff)
  staff: Staff[];
  captain: number;
  libero: number[];
  @Type(() => Player)
  players: Player[];
  @Type(() => Player)
  reserve: Player[];
  color: string;
  email: string;
}
