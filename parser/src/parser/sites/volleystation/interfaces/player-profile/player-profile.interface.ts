import { ISkillStatistics } from '../skills/skill-statistics.interface';
import { IPlayerSummaryStatistics } from './player-summary-statistics.interface';

export interface IPlayerProfile {
  id: number;

  /**
   * Имя
   */
  name: string;
  /**
   * Номер
   */
  number: number;

  /**
   * Страна
   */
  country?: string;

  /**
   * Позиция
   */
  position: string;

  /**
   * Статистика
   */
  statistic?: IPlayerSummaryStatistics;

  /**
   * Статистика навыков
   */
  skills: ISkillStatistics;
}
