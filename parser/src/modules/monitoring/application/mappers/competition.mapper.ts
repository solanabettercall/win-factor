import {
  Competition,
  ICompetition,
} from '../../domain/entities/competition.entity';
import { IRawComptition } from 'src/modules/volleystation/infrastructure/volleystation-competition.service';
import { CompetitionId } from '../../domain/value-objects/competition-id.vo';
import { CompetitionVersion } from '../../domain/value-objects/competition-version.vo';
import { CompetitionEntity } from '../../infrastructure/entities/competition.entity';

export class CompetitionMapper {
  static fromDomain(competition: Competition): CompetitionMapper {
    return new CompetitionMapper(competition, null, null);
  }

  static fromEntity(entity: CompetitionEntity): CompetitionMapper {
    return new CompetitionMapper(null, entity, null);
  }

  static fromRaw(raw: IRawComptition): CompetitionMapper {
    return new CompetitionMapper(null, null, raw);
  }

  toDomain(): Competition {
    if (this.competition) {
      return this.competition;
    }

    if (this.entity) {
      return CompetitionMapper.entityToDomain(this.entity);
    }

    if (this.raw) {
      const domainProps = CompetitionMapper.rawToDomain(this.raw);
      return Competition.create(domainProps);
    }

    throw new Error('No data available to convert to domain');
  }

  toEntity(): CompetitionEntity {
    if (this.entity) {
      return this.entity;
    }

    if (this.competition) {
      return CompetitionMapper.domainToEntity(this.competition);
    }

    if (this.raw) {
      const domain = this.toDomain();
      return CompetitionMapper.domainToEntity(domain);
    }

    throw new Error('No data available to convert to entity');
  }

  toRaw(): IRawComptition {
    if (this.raw) {
      return this.raw;
    }

    if (this.competition) {
      return {
        id: this.competition.getId(),
        name: this.competition.getName(),
        url: this.competition.getUrl(),
        version: this.competition.getVersion(),
      };
    }

    if (this.entity) {
      return {
        id: CompetitionId.create(this.entity.id),
        name: this.entity.name,
        url: this.entity.url,
        version: CompetitionVersion.create(this.entity.version),
      };
    }

    throw new Error('No data available to convert to raw');
  }

  private static rawToDomain(raw: IRawComptition): ICompetition {
    return {
      id: raw.id,
      name: raw.name,
      url: raw.url,
      version: raw.version,
    };
  }

  private static domainToEntity(competition: Competition): CompetitionEntity {
    const entity = new CompetitionEntity();
    entity.id = competition.getId().value;
    entity.name = competition.getName();
    entity.url = competition.getUrl();
    entity.version = competition.getVersion().value;

    return entity;
  }

  private static entityToDomain(entity: CompetitionEntity): Competition {
    const competition = Competition.create({
      id: CompetitionId.create(entity.id),
      name: entity.name,
      url: entity.url,
      version: CompetitionVersion.create(entity.version),
    });

    return competition;
  }

  private constructor(
    private readonly competition: Competition | null,
    private readonly entity: CompetitionEntity | null,
    private readonly raw: IRawComptition | null,
  ) {}
}
