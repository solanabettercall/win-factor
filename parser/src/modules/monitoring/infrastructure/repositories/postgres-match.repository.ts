import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../../domain/entities/match.entity';
import { MatchId } from '../../domain/value-objects/match-id.vo';
import { IMatchRepository } from '../../domain/repositories/match.repository.interface';
import { MatchEntity } from '../entities/match.entity';
import { MatchMapper } from '../../application/mappers/match.mapper';
import { TeamMapper } from '../../application/mappers/team.mapper';

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

    return this.mapEntityToDomain(entity);
  }

  async save(match: Match): Promise<void> {
    const entity = this.mapDomainToEntity(match);
    await this.matchRepository.save(entity);
  }

  private mapEntityToDomain(entity: MatchEntity): Match {
    const matchProps = MatchMapper.entityToDomain(entity);
    const match = Match.create(matchProps);

    // Добавляем команды если они есть
    if (entity.homeTeam) {
      const homeTeam = TeamMapper.entityToDomain(entity.homeTeam);
      match.updateHomeTeam(homeTeam);
    }

    if (entity.awayTeam) {
      const awayTeam = TeamMapper.entityToDomain(entity.awayTeam);
      match.updateAwayTeam(awayTeam);
    }

    return match;
  }

  private mapDomainToEntity(match: Match): MatchEntity {
    const entity = MatchMapper.domainToEntity(match);

    // Устанавливаем связи с командами только если они есть
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
}
