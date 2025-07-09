import { BaseEvent } from 'src/shared/domain/events/base.event';
import { IMatch } from '../entities/match.entity';

export class MatchCreatedEvent extends BaseEvent<IMatch> {
  constructor(public readonly match: IMatch) {
    super(match);
  }
}
