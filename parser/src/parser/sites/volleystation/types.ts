import { JobsOptions } from 'bullmq';
import { RawMatch } from './models/match-list/raw-match';
import { Competition } from './models/vollestation-competition';
import { GetPlayerDto } from './dtos/get-player.dto';
import { GetTeamDto } from './dtos/get-team.dto';
import { GetMatchesDto } from './dtos/get-matches.dto';
import { GetCompeitionDto } from './dtos/get-competition.dto';
import { Team } from 'src/monitoring/schemas/team.schema';
import { Player } from 'src/monitoring/schemas/player.schema';

export enum MatchListType {
  Schedule = 'schedule',
  Results = 'results',
}

export type GetCompetitionByIdDto = Pick<GetCompeitionDto, 'id'>;

export type VolleyJobData =
  | Competition
  | Team
  | Player
  | RawMatch
  | GetTeamDto
  | GetPlayerDto
  | GetMatchesDto
  | GetCompetitionByIdDto;

export type JobTask = {
  name?: string | undefined;
  data: VolleyJobData;
  opts?: JobsOptions;
};
