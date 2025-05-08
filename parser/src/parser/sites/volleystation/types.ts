import { JobsOptions } from 'bullmq';
import { RawMatch } from './models/match-list/raw-match';
import { Competition } from './models/vollestation-competition';
import { Team } from './models/team-list/team';
import { Player } from './models/team-roster/player';
import { GetPlayerDto } from './dtos/get-player.dto';
import { GetTeamDto } from './dtos/get-team.dto';
import { GetMatchesDto } from './dtos/get-matches.dto';

export enum MatchListType {
  Schedule = 'schedule',
  Results = 'results',
}

export type VolleyJobData =
  | Competition
  | Team
  | Player
  | RawMatch
  | GetTeamDto
  | GetPlayerDto
  | GetMatchesDto;

export type JobTask = {
  name?: string | undefined;
  data: VolleyJobData;
  opts?: JobsOptions;
};
