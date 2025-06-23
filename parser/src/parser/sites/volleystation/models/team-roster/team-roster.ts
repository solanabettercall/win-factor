import { Type } from 'class-transformer';
import { Player } from './player';
import { ITeamRoster } from '../../interfaces/team-roster/team-roster.interface';
import { SkillStatistics } from '../skills/skill-statistics';

/**
 * Статистика команды и состав игроков.
 */
export class TeamRoster implements ITeamRoster {
  id: string;
  playedMatches!: number;
  wonMatches!: number;
  lostMatches!: number;

  @Type(() => SkillStatistics)
  skills: SkillStatistics;

  @Type(() => Player)
  players!: Player[];
}
