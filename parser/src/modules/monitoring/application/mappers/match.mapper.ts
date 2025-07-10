import {
  IRawDetailedMatch,
  IRawMatch,
} from 'src/modules/volleystation/infrastructure/volleystation-match.service';
import { IMatchProps, Match } from '../../domain/entities/match.entity';
import { MatchId } from '../../domain/value-objects/match-id.vo';
import { MatchEntity } from '../../infrastructure/entities/match.entity';
import { TeamMapper } from './team.mapper';

export abstract class MatchMapper {
  static rawToDomain(raw: IRawMatch): IMatchProps {
    return {
      id: raw.id,
      matchUrl: raw.matchUrl,
    };
  }

  static rawDetailedToDomain(raw: IRawDetailedMatch): IMatchProps {
    return {
      id: raw.id,
      matchUrl: raw.url,
    };
  }

  static domainToEntity(match: Match): MatchEntity {
    const entity = new MatchEntity();
    entity.id = match.getId().value;
    entity.matchUrl = match.getMatchUrl();

    const homeTeam = match.getHomeTeam();
    if (homeTeam) {
      entity.homeTeam = TeamMapper.domainToEntity(homeTeam);
    }

    const awayTeam = match.getAwayTeam();
    if (awayTeam) {
      entity.awayTeam = TeamMapper.domainToEntity(awayTeam);
    }

    return entity;
  }

  static entityToDomain(entity: MatchEntity): IMatchProps {
    return {
      id: MatchId.create(entity.id),
      matchUrl: entity.matchUrl,
    };
  }
}

// Backward compatibility
export const mapRawToMatch = MatchMapper.rawToDomain;
export const mapRawDetailedToMatch = MatchMapper.rawDetailedToDomain;
