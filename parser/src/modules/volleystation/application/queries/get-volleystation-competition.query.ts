import { Query } from '@nestjs/cqrs';
import { CompetitionId } from 'src/modules/monitoring/domain/value-objects/competition-id.vo';
import { IRawComptition } from '../../infrastructure/volleystation-competition.service';

export class GetVolleystationCompetitionQuery extends Query<IRawComptition | null> {
  constructor(public readonly id: CompetitionId) {
    super();
  }
}
