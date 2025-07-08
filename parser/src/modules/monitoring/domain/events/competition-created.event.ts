import { BaseEvent } from 'src/shared/domain/events/base.event';
import { ICompetition } from '../entities/competition.entity';

export class CompetitionCreatedEvent extends BaseEvent<ICompetition> {
  constructor(public readonly competition: ICompetition) {
    super(competition);
  }
}
