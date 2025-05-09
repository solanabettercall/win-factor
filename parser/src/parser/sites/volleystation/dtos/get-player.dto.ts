import { Type } from 'class-transformer';
import { Competition } from '../models/vollestation-competition';

export class GetPlayerDto {
  @Type(() => Competition)
  competition: Competition;
  playerId: number;
}
