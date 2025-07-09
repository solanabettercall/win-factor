import { BaseEvent } from 'src/shared/domain/events/base.event';
import { IMatchProps } from '../entities/match.entity';

export class MatchCreatedEvent extends BaseEvent<IMatchProps> {
  constructor(public readonly match: IMatchProps) {
    super(match);
  }
}
