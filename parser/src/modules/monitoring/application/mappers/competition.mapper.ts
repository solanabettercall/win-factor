import {
  Competition,
  ICompetition,
} from '../../domain/entities/competition.entity';
import { IRawComptition } from 'src/modules/volleystation/infrastructure/volleystation-competition.service';
import { CompetitionId } from '../../domain/value-objects/competition-id.vo';
import { CompetitionVersion } from '../../domain/value-objects/competition-version.vo';
import { CompetitionEntity } from '../../infrastructure/entities/competition.entity';

export abstract class CompetitionMapper {
  static rawToDomain(raw: IRawComptition): ICompetition {
    return {
      id: raw.id,
      name: raw.name,
      url: raw.url,
      version: raw.version,
    };
  }

  static domainToEntity(competition: Competition): CompetitionEntity {
    const entity = new CompetitionEntity();
    entity.id = competition.getId().value;
    entity.name = competition.getName();
    entity.url = competition.getUrl();
    entity.version = competition.getVersion().value;

    return entity;
  }

  static entityToDomain(entity: CompetitionEntity): Competition {
    const competition = Competition.create({
      id: CompetitionId.create(entity.id),
      name: entity.name,
      url: entity.url,
      version: CompetitionVersion.create(entity.version),
    });

    return competition;
  }
}
