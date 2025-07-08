import { BaseEntity } from 'src/shared/domain/entities/base.entity';
import { CompetitionId } from '../value-objects/competition-id.vo';
import { BadRequestException } from '@nestjs/common';
import { CompetitionCreatedEvent } from '../events/competition-created.event';

export interface ICompetition {
  id: CompetitionId;
  name: string;
  url: string;
  version: string;
}

export class Competition extends BaseEntity<CompetitionId, ICompetition> {
  private constructor(props: ICompetition) {
    super(props.id, props);
    this.apply(new CompetitionCreatedEvent(props));
  }

  public static validate(props: ICompetition) {
    if (props.name.length < 1) {
      throw new BadRequestException(`Название турнира не должено быть пустым`);
    }
  }

  public static create(props: ICompetition) {
    this.validate(props);

    return new Competition(props);
  }

  public getName() {
    return this.props.name;
  }

  public getUrl() {
    return this.props.url;
  }

  public getId() {
    return this.props.id;
  }
}
