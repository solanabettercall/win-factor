import { IRawTeam } from 'src/modules/volleystation/infrastructure/volleystation-team.service';
import { ITeam, Team } from '../../domain/entities/team.entity';
import { TeamId } from '../../domain/value-objects/team-id.vo';
import { TeamEntity } from '../../infrastructure/entities/team.entity';

export class TeamMapper {
  static fromDomain(team: Team): TeamMapper {
    return new TeamMapper(team, null, null);
  }

  static fromEntity(entity: TeamEntity): TeamMapper {
    return new TeamMapper(null, entity, null);
  }

  static fromRaw(raw: IRawTeam): TeamMapper {
    return new TeamMapper(null, null, raw);
  }

  toDomain(): Team {
    if (this.team) {
      return this.team;
    }

    if (this.entity) {
      return TeamMapper.entityToDomain(this.entity);
    }

    if (this.raw) {
      const domainProps = TeamMapper.rawToDomain(this.raw);
      return Team.create(domainProps);
    }

    throw new Error('No data available to convert to domain');
  }

  toEntity(): TeamEntity {
    if (this.entity) {
      return this.entity;
    }

    if (this.team) {
      return TeamMapper.domainToEntity(this.team);
    }

    if (this.raw) {
      const domain = this.toDomain();
      return TeamMapper.domainToEntity(domain);
    }

    throw new Error('No data available to convert to entity');
  }

  toRaw(): IRawTeam {
    if (this.raw) {
      return this.raw;
    }

    if (this.team) {
      return {
        id: this.team.getId(),
        name: this.team.getName(),
        url: this.team.getUrl(),
        logoUrl: null, // Domain не содержит logoUrl, поэтому устанавливаем null
      };
    }

    if (this.entity) {
      return {
        id: TeamId.create(this.entity.numeric, this.entity.code),
        name: this.entity.name,
        url: this.entity.url,
        logoUrl: null, // Entity не содержит logoUrl, поэтому устанавливаем null
      };
    }

    throw new Error('No data available to convert to raw');
  }

  private static rawToDomain(raw: IRawTeam): ITeam {
    return {
      id: raw.id,
      name: raw.name,
      url: raw.url,
    };
  }

  private static domainToEntity(team: Team): TeamEntity {
    const entity = new TeamEntity();
    const teamId = team.getId();
    entity.numeric = teamId.numeric;
    entity.code = teamId.code;
    entity.name = team.getName();
    entity.url = team.getUrl();

    return entity;
  }

  private static entityToDomain(entity: TeamEntity): Team {
    const team = Team.create({
      id: TeamId.create(entity.numeric, entity.code),
      name: entity.name,
      url: entity.url,
    });

    return team;
  }

  private constructor(
    private readonly team: Team | null,
    private readonly entity: TeamEntity | null,
    private readonly raw: IRawTeam | null,
  ) {}
}
