import { Query } from '@nestjs/cqrs';
import {
  GetTeamDto,
  IRawDetailedTeam,
} from '../../infrastructure/volleystation-team.service';

export class GetVolleystationTeamQuery extends Query<IRawDetailedTeam | null> {
  constructor(public readonly dto: GetTeamDto) {
    super();
  }
}
