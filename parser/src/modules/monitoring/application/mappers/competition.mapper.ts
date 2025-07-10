import {
  ICompetition,
  Competition,
} from '../../domain/entities/competition.entity';
import { IRawComptition } from 'src/modules/volleystation/infrastructure/volleystation-competition.service';
import { CompetitionId } from '../../domain/value-objects/competition-id.vo';
import { CompetitionVersion } from '../../domain/value-objects/competition-version.vo';
import { TeamId } from '../../domain/value-objects/team-id.vo';
import { CompetitionEntity } from '../../infrastructure/entities/competition.entity';
import { TeamEntity } from '../../infrastructure/entities/team.entity';

export class CompetitionMapper {
  static rawToDomain(raw: IRawComptition): ICompetition {
    return {
      id: CompetitionId.create(raw.id),
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

    const teams = competition.getTeams();
    if (teams.length > 0) {
      entity.teams = teams.map((team) => {
        const teamEntity = new TeamEntity();
        const teamId = team.getId();
        teamEntity.numeric = teamId.numeric;
        teamEntity.code = teamId.code;
        teamEntity.name = team.getName();
        teamEntity.url = team.getUrl();
        return teamEntity;
      });
    }

    return entity;
  }

  static entityToDomain(entity: CompetitionEntity): Competition {
    const competition = Competition.create({
      id: CompetitionId.create(entity.id),
      name: entity.name,
      url: entity.url,
      version: CompetitionVersion.create(entity.version),
    });

    if (entity.teams && entity.teams.length > 0) {
      const teams = entity.teams.map((teamEntity) => ({
        id: TeamId.create(teamEntity.numeric, teamEntity.code),
        name: teamEntity.name,
        url: teamEntity.url,
      }));
      competition.addTeams(teams);
    }

    return competition;
  }
}
