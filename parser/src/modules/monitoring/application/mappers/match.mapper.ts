import {
  IRawDetailedMatch,
  IRawMatch,
} from 'src/modules/volleystation/infrastructure/volleystation-match.service';
import { Match } from '../../domain/entities/match.entity';
import { MatchId } from '../../domain/value-objects/match-id.vo';
import { MatchEntity } from '../../infrastructure/entities/match.entity';
import { TeamMapper } from './team.mapper';

export class MatchMapper {
  static fromDomain(domain: Match): MatchMapper {
    return new MatchMapper(domain);
  }

  static fromEntity(entity: MatchEntity): MatchMapper {
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

    return new MatchMapper(match);
  }

  static fromRaw(raw: IRawMatch | IRawDetailedMatch): MatchMapper {
    const domain = Match.create(raw);
    return new MatchMapper(domain);
  }

  toDomain(): Match {
    return this.domain;
  }

  toEntity(): MatchEntity {
    const entity = new MatchEntity();
    entity.id = this.domain.getId().value;
    entity.matchUrl = this.domain.getMatchUrl();

    const homeTeam = this.domain.getHomeTeam();
    const awayTeam = this.domain.getAwayTeam();

    if (homeTeam && awayTeam) {
      entity.homeTeam = TeamMapper.fromDomain(homeTeam).toEntity();
      entity.awayTeam = TeamMapper.fromDomain(awayTeam).toEntity();
    }

    return entity;
  }

  private constructor(private readonly domain: Match) {}
}
