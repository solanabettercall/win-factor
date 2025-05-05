import { IBlock } from '../skills/block.interface';
import { IPlayer } from './player.interface';
import { IReception } from '../skills/reception.interface';
import { ISpike } from '../skills/spike.interface';
import { IServe } from '../skills/serve.interface';
import { ISkillStatistics } from '../skills/skill-statistics.interface';

/**
 * Основная статистика команды по сыгранным матчам и техническим действиям.
 */
export interface ITeamRoster {
  /**
   * Количество сыгранных матчей.
   */
  playedMatches: number;

  /**
   * Количество выигранных матчей.
   */
  wonMatches: number;

  /**
   * Количество проигранных матчей.
   */
  lostMatches: number;

  // /**
  //  * Статистика подач.
  //  */
  // serve: IServe;

  // /**
  //  * Статистика приёма подачи.
  //  */
  // reception: IReception;

  // /**
  //  * Статистика атак.
  //  */
  // spike: ISpike;

  // /**
  //  * Статистика блоков.
  //  */
  // block: IBlock;

  skills: ISkillStatistics;

  /** Состав команды */
  players: IPlayer[];
}
