import { BaseEvent } from 'src/shared/domain/events/base.event';
import { ICompetitionProps } from '../entities/competition.entity';

export class CompetitionCreatedEvent extends BaseEvent<ICompetitionProps> {
  constructor(public readonly competition: ICompetitionProps) {
    super(competition);
  }
}
