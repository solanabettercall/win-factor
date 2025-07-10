import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../../domain/entities/match.entity';
import { MatchId } from '../../domain/value-objects/match-id.vo';
import { IMatchRepository } from '../../domain/repositories/match.repository.interface';
import { MatchEntity } from '../entities/match.entity';
import { MatchMapper } from '../../application/mappers/match.mapper';

@Injectable()
export class PostgresMatchRepository implements IMatchRepository {
  constructor(
    @InjectRepository(MatchEntity)
    private readonly matchRepository: Repository<MatchEntity>,
  ) {}

  async findById(id: MatchId): Promise<Match | null> {
    const entity = await this.matchRepository.findOne({
      where: { id: id.value },
      relations: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    if (!entity) {
      return null;
    }

    return MatchMapper.fromEntity(entity).toDomain();
  }

  async save(match: Match): Promise<void> {
    const entity = MatchMapper.fromDomain(match).toEntity();
    await this.matchRepository.save(entity);
  }

  // private mapEntityToDomain(entity: MatchEntity): Match {
  //   const matchProps = MatchMapper.fromEntity(entity).toDomain();
  //   const match = Match.create(matchProps);

  //   if (entity.homeTeam) {
  //     const homeTeam = TeamMapper.fromEntity(entity.homeTeam).toDomain();
  //     match.updateHomeTeam(homeTeam);
  //   }

  //   if (entity.awayTeam) {
  //     const awayTeam = TeamMapper.fromEntity(entity.awayTeam).toDomain();
  //     match.updateAwayTeam(awayTeam);
  //   }

  //   return match;
  // }

  // private mapDomainToEntity(match: Match): MatchEntity {
  //   const entity = MatchMapper.domainToEntity(match);

  //   const homeTeam = match.getHomeTeam();
  //   if (homeTeam) {
  //     entity.homeTeam = TeamMapper.fromDomain(homeTeam).toEntity();
  //   }

  //   const awayTeam = match.getAwayTeam();
  //   if (awayTeam) {
  //     entity.awayTeam = TeamMapper.fromDomain(awayTeam).toEntity();
  //   }

  //   return entity;
  // }
}
