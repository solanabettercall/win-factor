import { IBlock } from './block.interface';
import { IPlayer } from './player.interface';
import { IReception } from './reception.interface';
import { IServe } from './serve.interface';
import { ISpike } from './spike.interface';

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

  /**
   * Статистика подач.
   */
  serve: IServe;

  /**
   * Статистика приёма подачи.
   */
  reception: IReception;

  /**
   * Статистика атак.
   */
  spike: ISpike;

  /**
   * Статистика блоков.
   */
  block: IBlock;

  /** Состав команды */
  players: IPlayer[];
}
