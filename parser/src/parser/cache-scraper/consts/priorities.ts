import { CachableEntityType } from './ttl';

export const priorities: Record<CachableEntityType, number> = {
  onlineMatch: 1,
  competition: 2,
  scheduledMatch: 3,
  players: 4,
  teams: 5,
  scheduledMatches: 6,
  team: 7,
  player: 8,
  resultsMatches: 9,
  completedMatch: 10,
};
