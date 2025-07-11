import { IRawTeam } from 'src/modules/volleystation/infrastructure/volleystation-team.service';
import { ITeam, Team } from '../../domain/entities/team.entity';
import { TeamId } from '../../domain/value-objects/team-id.vo';
import { TeamEntity } from '../../infrastructure/entities/team.entity';

export class TeamMapper {
  static fromDomain(team: Team): TeamMapper {
    return new TeamMapper(team);
  }

  static fromEntity(entity: TeamEntity): TeamMapper {
    const team = Team.create({
      id: TeamId.create(entity.numeric, entity.code),
      name: entity.name,
      url: entity.url,
    });

    return new TeamMapper(team);
  }

  static fromRaw(raw: IRawTeam): TeamMapper {
    const team = Team.create(raw);

    return new TeamMapper(team);
  }

  toDomain(): Team {
    return this.team;
  }

  toEntity(): TeamEntity {
    const entity = new TeamEntity();
    const teamId = this.team.getId();
    entity.numeric = teamId.numeric;
    entity.code = teamId.code;
    entity.name = this.team.getName();
    entity.url = this.team.getUrl();

    return entity;
  }

  toRaw(): IRawTeam {
    return {
      id: this.team.getId(),
      name: this.team.getName(),
      url: this.team.getUrl(),
      logoUrl: null,
    };
  }

  private constructor(private readonly team: Team) {}
}
