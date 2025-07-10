import {
  IRawDetailedMatch,
  IRawMatch,
} from 'src/modules/volleystation/infrastructure/volleystation-match.service';
import { IMatchProps, Match } from '../../domain/entities/match.entity';
import { MatchId } from '../../domain/value-objects/match-id.vo';
import { MatchEntity } from '../../infrastructure/entities/match.entity';
import { TeamMapper } from './team.mapper';

export class MatchMapper {
  static fromDomain(match: Match): MatchMapper {
    return new MatchMapper(match, null, null);
  }

  static fromEntity(entity: MatchEntity): MatchMapper {
    return new MatchMapper(null, entity, null);
  }

  static fromRaw(raw: IRawMatch): MatchMapper {
    return new MatchMapper(null, null, raw);
  }

  static fromRawDetailed(raw: IRawDetailedMatch): MatchMapper {
    return new MatchMapper(null, null, raw);
  }

  toDomain(): Match {
    if (this.match) {
      return this.match;
    }

    if (this.entity) {
      return MatchMapper.entityToDomain(this.entity);
    }

    if (this.raw) {
      const domainProps = MatchMapper.rawToDomain(this.raw);
      return Match.create(domainProps);
    }

    throw new Error('No data available to convert to domain');
  }

  toEntity(): MatchEntity {
    if (this.entity) {
      return this.entity;
    }

    if (this.match) {
      return MatchMapper.domainToEntity(this.match);
    }

    if (this.raw) {
      console.log('this.raw: ', this.raw);

      const domain = this.toDomain();
      return MatchMapper.domainToEntity(domain);
    }

    throw new Error('No data available to convert to entity');
  }

  toRaw(): IRawMatch {
    if (this.raw) {
      return this.raw;
    }

    if (this.match) {
      return {
        id: this.match.getId(),
        url: this.match.getMatchUrl(),
      };
    }

    throw new Error('No data available to convert to raw');
  }

  private static rawToDomain(raw: IRawMatch): IMatchProps {
    return {
      id: raw.id,
      url: raw.url,
    };
  }

  private static rawDetailedToDomain(raw: IRawDetailedMatch): IMatchProps {
    return {
      id: raw.id,
      url: raw.url,
    };
  }

  private static domainToEntity(match: Match): MatchEntity {
    const entity = new MatchEntity();
    entity.id = match.getId().value;
    entity.matchUrl = match.getMatchUrl();

    const homeTeam = match.getHomeTeam();
    const awayTeam = match.getAwayTeam();

    if (homeTeam && awayTeam) {
      entity.homeTeam = TeamMapper.fromDomain(homeTeam).toEntity();
      entity.awayTeam = TeamMapper.fromDomain(awayTeam).toEntity();
    }

    return entity;
  }

  private static entityToDomain(entity: MatchEntity): Match {
    const match = Match.create({
      id: MatchId.create(entity.id),
      url: entity.matchUrl,
    });
    const homeTeamEntity = entity.homeTeam;
    const awayTeamEntity = entity.awayTeam;

    if (homeTeamEntity && awayTeamEntity) {
      match.updateHomeTeam(TeamMapper.fromEntity(homeTeamEntity).toDomain());
      match.updateAwayTeam(TeamMapper.fromEntity(awayTeamEntity).toDomain());
    }

    return match;
  }

  private constructor(
    private readonly match: Match | null,
    private readonly entity: MatchEntity | null,
    private readonly raw: IRawMatch | null,
  ) {}
}
