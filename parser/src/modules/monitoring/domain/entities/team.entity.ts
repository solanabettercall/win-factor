import { BaseEntity } from 'src/shared/domain/entities/base.entity';
import { BadRequestException } from '@nestjs/common';
import { TeamId } from '../value-objects/team-id.vo';
import { TeamCreatedEvent } from '../events/team-created.event';
import { CompetitionId } from '../value-objects/competition-id.vo';
import { PlayerId } from '../value-objects/player-id.vo';

export interface ITeam {
  id: TeamId;
  competitionId: CompetitionId;
  name: string;
  url: string;
  playerIds?: PlayerId[];
}

export class Team extends BaseEntity<TeamId, ITeam> {
  public getPlayerIds(): PlayerId[] {
    return this.props.playerIds ?? [];
  }
  public getCompetitionId(): CompetitionId {
    return this.props.competitionId;
  }

  private constructor(props: ITeam) {
    super(props.id, {
      id: props.id,
      competitionId: props.competitionId,
      name: props.name,
      url: props.url,
      playerIds: props.playerIds,
    });
    this.apply(new TeamCreatedEvent(props));
  }

  public [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      id: this.props.id,
      name: this.props.name,
      url: this.props.url,
      competitionId: this.props.competitionId,
    };
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
  public getUrl(): string {
    return this.props.url;
  }

  public getName(): string {
    return this.props.name;
  }

  public getId(): TeamId {
    return this.props.id;
  }
}
