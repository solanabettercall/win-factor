import { Type } from 'class-transformer';
import { Reception } from '../skills/reception';
import { Serve } from '../skills/serve';
import { Block } from '../skills/block';
import { Spike } from '../skills/spike';
import { ITeamRoster } from '../../interfaces/team-roster/team-roster.interface';
import { SkillStatistics } from '../skills/skill-statistics';
import { Player } from 'src/monitoring/schemas/player.schema';

/**
 * Статистика команды и состав игроков.
 */
export class TeamRoster implements ITeamRoster {
  playedMatches!: number;
  wonMatches!: number;
  lostMatches!: number;

  // @Type(() => Serve)
  // serve!: Serve;

  // @Type(() => Reception)
  // reception!: Reception;

  // @Type(() => Spike)
  // spike!: Spike;

  // @Type(() => Block)
  // block!: Block;

  @Type(() => SkillStatistics)
  skills: SkillStatistics;

  @Type(() => Player)
  players!: Player[];
}
