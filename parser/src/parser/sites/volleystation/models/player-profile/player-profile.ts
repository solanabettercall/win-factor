import { Type } from 'class-transformer';
import { IPlayerProfile } from '../../interfaces/player-profile/player-profile.interface';
import { SkillStatistics } from '../skills/skill-statistics';
import { PlayerSummaryStatistics } from './player-summary-statistics.interface';

export class PlayerProfile implements IPlayerProfile {
  id: number;

  country?: string;
  position: string;
  /**
   * Имя
   */
  name: string;
  /**
   * Номер
   */
  number: number;

  /**
   * Статистика
   */
  @Type(() => PlayerSummaryStatistics)
  statistic: PlayerSummaryStatistics;

  /**
   * Статистика навыков
   */
  @Type(() => SkillStatistics)
  skills: SkillStatistics;
}
