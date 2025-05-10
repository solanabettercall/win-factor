import { randomInt } from 'crypto';

export interface ICacheOption {
  /**
   *
   * @returns TTL в секундах кэша внешнего API
   */
  cache: () => number;
  /**
   *
   * @returns TTL в миллисекундах повтора
   */
  repeat: () => number;
  /**
   *
   * @returns TTL в миллисекундах метки дубля
   */
  deduplication: () => number;
}

export type CachableEntityType =
  | 'player'
  | 'team'
  | 'teams'
  | 'players'
  | 'scheduledMatches'
  | 'resultsMatches'
  | 'onlineMatch'
  | 'scheduledMatch'
  | 'completedMatch'
  | 'competition';

export const ttl: Record<CachableEntityType, ICacheOption> = {
  player: {
    cache: () => randomInt(28_800, 57_600), // 8-16 часов
    repeat: () => randomInt(3_600_000, 7_200_000), // 1-2 часа
    deduplication: () => randomInt(3_600_000, 7_200_000),
  },
  players: {
    cache: () => randomInt(86400, 259200),
    repeat: () => randomInt(14_400_000, 28_800_000),
    deduplication: () => randomInt(14_400_000, 28_800_000),
  },
  resultsMatches: {
    cache: () => randomInt(86400, 259200),
    repeat: () => randomInt(14_400_000, 28_800_000),
    deduplication: () => randomInt(14_400_000, 28_800_000),
  },
  scheduledMatches: {
    cache: () => randomInt(1800, 3600),
    repeat: () => randomInt(225_000, 450_000),
    deduplication: () => randomInt(225_000, 450_000),
  },
  team: {
    cache: () => randomInt(86400, 259200),
    repeat: () => randomInt(10_800_000, 21_600_000),
    deduplication: () => randomInt(10_800_000, 21_600_000),
  },
  teams: {
    cache: () => randomInt(86400, 259200),
    repeat: () => randomInt(10_800_000, 21_600_000),
    deduplication: () => randomInt(10_800_000, 21_600_000),
  },

  onlineMatch: {
    cache: () => randomInt(5, 10),
    repeat: () => randomInt(2_000, 4_000),
    deduplication: () => randomInt(2_000, 4_000),
  },

  scheduledMatch: {
    cache: () => randomInt(600, 900),
    repeat: () => randomInt(75_000, 150_000),
    deduplication: () => randomInt(75_000, 150_000),
  },
  completedMatch: {
    cache: () => randomInt(86400, 259200),
    repeat: () => randomInt(10_800_000, 21_600_000),
    deduplication: () => randomInt(10_800_000, 21_600_000),
  },

  competition: {
    cache: () => 0,
    repeat: () => randomInt(30_000, 40_000),
    deduplication: () => randomInt(30_000, 40_000),
  },
};
