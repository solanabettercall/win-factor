import { Type } from 'class-transformer';
import { Team } from './team.model';

export class Teams {
  @Type(() => Team)
  home: Team;

  @Type(() => Team)
  away: Team;
}
