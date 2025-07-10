import { BaseEvent } from 'src/shared/domain/events/base.event';
import { ITeam } from '../entities/team.entity';

export class TeamCreatedEvent extends BaseEvent<ITeam> {
  constructor(public readonly props: ITeam) {
    super(props);
  }
}
