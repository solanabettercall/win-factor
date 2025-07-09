import { Query } from '@nestjs/cqrs';
import {
  GetRawDetailedMatchDto,
  IRawDetailedMatch,
} from '../../infrastructure/volleystation-match.service';

export class GetVolleystationMatchQuery extends Query<IRawDetailedMatch | null> {
  constructor(public readonly dto: GetRawDetailedMatchDto) {
    super();
  }
}
