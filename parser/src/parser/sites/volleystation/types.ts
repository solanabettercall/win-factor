import { JobOptions } from 'bull';
import { RawMatch } from './models/match-list/raw-match';
import { Competition } from './models/vollestation-competition';
import { Team } from './models/team-list/team';
import { Player } from './models/team-roster/player';

export type JobData =
  | Competition
  | Team
  | Player
  | RawMatch
  | { team: Team; competition: Competition }
  | { player: Player; competition: Competition };

export type JobTask = {
  name?: string | undefined;
  data: JobData;
  opts?: Omit<JobOptions, 'repeat'> | undefined;
};
