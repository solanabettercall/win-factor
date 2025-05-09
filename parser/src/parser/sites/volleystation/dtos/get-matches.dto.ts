import { Transform } from 'class-transformer';
import { Competition } from '../models/vollestation-competition';
import { MatchListType } from '../types';

export class GetMatchesDto {
  competition: Competition;
  @Transform(({ type }) => MatchListType[type])
  type: MatchListType;
}
