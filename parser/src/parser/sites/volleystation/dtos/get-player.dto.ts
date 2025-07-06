import { Type } from 'class-transformer';
import { Competition } from 'src/monitoring/schemas/competition.schema';

export class GetPlayerDto {
  @Type(() => Competition)
  competition: Competition;
  playerId: number;
}
