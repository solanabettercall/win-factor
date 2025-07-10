import { IRawTeam } from 'src/modules/volleystation/infrastructure/volleystation-team.service';
import { ITeam, Team } from '../../domain/entities/team.entity';
import { TeamId } from '../../domain/value-objects/team-id.vo';
import { TeamEntity } from '../../infrastructure/entities/team.entity';

export abstract class TeamMapper {
  static rawToDomain(raw: IRawTeam): ITeam {
    return {
      id: raw.id,
      name: raw.name,
      url: raw.url,
    };
  }

  static domainToEntity(team: Team | Readonly<Team>): TeamEntity {
    const entity = new TeamEntity();
    const teamId = team.getId();
    entity.numeric = teamId.numeric;
    entity.code = teamId.code;
    entity.name = team.getName();
    entity.url = team.getUrl();
    return entity;
  }

  static entityToDomain(entity: TeamEntity): Team {
    const team = Team.create({
      id: TeamId.create(entity.numeric, entity.code),
      name: entity.name,
      url: entity.url,
    });

    return team;
  }
}
