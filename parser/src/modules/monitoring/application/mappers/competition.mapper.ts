import { Competition } from '../../domain/entities/competition.entity';
import { IRawComptition } from 'src/modules/volleystation/infrastructure/volleystation-competition.service';
import { CompetitionId } from '../../domain/value-objects/competition-id.vo';
import { CompetitionVersion } from '../../domain/value-objects/competition-version.vo';
import { CompetitionEntity } from '../../infrastructure/entities/competition.entity';

export class CompetitionMapper {
  static fromDomain(competition: Competition): CompetitionMapper {
    return new CompetitionMapper(competition);
  }

  static fromEntity(entity: CompetitionEntity): CompetitionMapper {
    const competition = Competition.create({
      id: CompetitionId.create(entity.id),
      name: entity.name,
      url: entity.url,
      version: CompetitionVersion.create(entity.version),
    });

    return new CompetitionMapper(competition);
  }

  static fromRaw(raw: IRawComptition): CompetitionMapper {
    const domain = Competition.create(raw);

    return new CompetitionMapper(domain);
  }

  toDomain(): Competition {
    return this.domain;
  }

  toEntity(): CompetitionEntity {
    const entity = new CompetitionEntity();
    entity.id = this.domain.getId().value;
    entity.name = this.domain.getName();
    entity.url = this.domain.getUrl();
    entity.version = this.domain.getVersion().value;

    return entity;
  }

  private constructor(private readonly domain: Competition) {}
}
