import { Query } from '@nestjs/cqrs';
import { Competition } from 'src/modules/monitoring/domain/entities/competition.entity';
import { IRawPlayer } from '../../infrastructure/volleystation-player.service';

export class GetVolleystationPlayersQuery extends Query<IRawPlayer[]> {
  constructor(public readonly competition: Competition) {
    super();
  }
}
