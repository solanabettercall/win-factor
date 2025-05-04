import { Type } from 'class-transformer';
import { Reception } from './reception';
import { Serve } from './serve';
import { Block } from './block';
import { Player } from './player';
import { Spike } from './spike';
import { ITeamRoster } from '../../interfaces/team-roster/team-roster.interface';

/**
 * Статистика команды и состав игроков.
 */
export class TeamRoster implements ITeamRoster {
  playedMatches!: number;
  wonMatches!: number;
  lostMatches!: number;

  @Type(() => Serve)
  serve!: Serve;

  @Type(() => Reception)
  reception!: Reception;

  @Type(() => Spike)
  spike!: Spike;

  @Type(() => Block)
  block!: Block;

  @Type(() => Player)
  players!: Player[];
}
