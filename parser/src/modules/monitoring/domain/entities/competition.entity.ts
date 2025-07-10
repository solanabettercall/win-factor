import { BaseEntity } from 'src/shared/domain/entities/base.entity';
import { CompetitionId } from '../value-objects/competition-id.vo';
import { BadRequestException, Logger } from '@nestjs/common';
import { CompetitionCreatedEvent } from '../events/competition-created.event';
import { CompetitionVersion } from '../value-objects/competition-version.vo';

export interface ICompetition {
  id: CompetitionId;
  name: string;
  url: string;
  version: CompetitionVersion;
}

export class Competition extends BaseEntity<CompetitionId, ICompetition> {
  private readonly logger = new Logger(this.constructor.name);

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
    Competition.validate(props);

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

  public getVersion(): CompetitionVersion {
    return this.props.version;
  }
}
