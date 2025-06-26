import { Transform } from 'class-transformer';
import { MatchListType } from '../types';
import { Competition } from 'src/monitoring/schemas/competition.schema';

export class GetMatchesDto {
  competition: Competition;
  @Transform(({ type }) => MatchListType[type])
  type: MatchListType;
}
