import { BaseEntity } from 'src/shared/domain/entities/base.entity';
import { BadRequestException } from '@nestjs/common';
import { TeamId } from '../value-objects/team-id.vo';
import { TeamCreatedEvent } from '../events/team-created.event';

export interface ITeam {
  id: TeamId;
  name: string;
  url: string;
}

export class Team extends BaseEntity<TeamId, ITeam> {
  private constructor(props: ITeam) {
    super(props.id, props);
    this.apply(new TeamCreatedEvent(props));
  }

  public static validate(props: ITeam) {
    if (props.name.length < 1) {
      throw new BadRequestException(`Название команды не должено быть пустым`);
    }
  }

  public static create(props: ITeam): Team {
    Team.validate(props);

    return new Team(props);
  }

  public getName(): string {
    return this.props.name;
  }

  public getId(): TeamId {
    return this.props.id;
  }
}
