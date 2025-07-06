import { Type } from 'class-transformer';
import { Competition } from 'src/monitoring/schemas/competition.schema';

export class GetTeamDto {
  @Type(() => Competition)
  competition: Competition;
  teamId: string;
}
