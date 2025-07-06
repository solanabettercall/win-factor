import { Type } from 'class-transformer';
import { Competition } from 'src/monitoring/schemas/competition.schema';

export class GetTeamByShortIdDto {
  @Type(() => Competition)
  competition: Competition;
  shortId: string;
}
