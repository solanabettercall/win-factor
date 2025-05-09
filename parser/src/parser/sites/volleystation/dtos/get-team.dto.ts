import { Type } from 'class-transformer';
import { Competition } from '../models/vollestation-competition';

export class GetTeamDto {
  @Type(() => Competition)
  competition: Competition;
  teamId: string;
}
