import { Query } from '@nestjs/cqrs';
import { Competition } from '../../domain/entities/competition.entity';
import { CompetitionId } from '../../domain/value-objects/competition-id.vo';

export class GetCompetitionQuery extends Query<Competition | null> {
  constructor(public readonly id: CompetitionId) {
    super();
  }
}
