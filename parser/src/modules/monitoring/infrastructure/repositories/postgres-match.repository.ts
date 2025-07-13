import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../../domain/entities/match.entity';
import { MatchId } from '../../domain/value-objects/match-id.vo';
import { IMatchRepository } from '../../domain/repositories/match.repository.interface';
import { MatchEntity } from '../entities/match.entity';
import { CompetitionId } from '../../domain/value-objects/competition-id.vo';
import { TeamId } from '../../domain/value-objects/team-id.vo';
import { CompetitionEntity } from '../entities/competition.entity';
import { TeamEntity } from '../entities/team.entity';

@Injectable()
export class PostgresMatchRepository implements IMatchRepository {
  constructor(
    @InjectRepository(MatchEntity)
    private readonly matchRepository: Repository<MatchEntity>,
    @InjectRepository(CompetitionEntity)
    private readonly competitionRepository: Repository<CompetitionEntity>,
    @InjectRepository(TeamEntity)
    private readonly teamRepository: Repository<TeamEntity>,
  ) {}

  async findById(id: MatchId): Promise<Match | null> {
    const entity = await this.matchRepository.findOne({
      where: { id: id.value },
      relations: {
        homeTeam: true,
        awayTeam: true,
        competition: true,
      },
    });

    if (!entity) {
      return null;
    }

    return this.entityToDomain(entity);
  }

  async save(match: Match): Promise<void> {
    const entity: MatchEntity = await this.domainToEntity(match);
    await this.matchRepository.save(entity);
  }

  private async domainToEntity(match: Match): Promise<MatchEntity> {
    const competition = await this.competitionRepository.findOneOrFail({
      where: {
        id: match.getCompetitionId().value,
      },
    });

    const entity = MatchEntity.create({
      id: match.getId().value,
      competition,
      matchUrl: match.getMatchUrl(),
      awayTeam: null,
      homeTeam: null,
    });
    const homeTeamId = match.getHomeTeamId();
    const awayTeamId = match.getAwayTeamId();

    if (homeTeamId && awayTeamId) {
      const homeTeam: TeamEntity | null = await this.teamRepository.findOne({
        where: {
          code: homeTeamId?.code,
          numeric: homeTeamId?.numeric,
        },
      });

      const awayTeam: TeamEntity | null = await this.teamRepository.findOne({
        where: {
          code: awayTeamId?.code,
          numeric: awayTeamId?.numeric,
        },
      });

      entity.homeTeam = homeTeam;
      entity.awayTeam = awayTeam;
    }

    return entity;
  }

  private entityToDomain(match: MatchEntity): Match {
    const id = MatchId.create(match.id);
    const competitionId = CompetitionId.create(match.competition.id);

    const domain = Match.create({
      id,
      competitionId,
      url: match.matchUrl,
    });

    if (match?.awayTeam && match?.homeTeam) {
      const homeTeamId = TeamId.create(
        match.homeTeam.numeric,
        match.homeTeam.code,
      );
      domain.updateAwayTeam(homeTeamId);

      const awayTeamId = TeamId.create(
        match.awayTeam.numeric,
        match.awayTeam.code,
      );
      domain.updateAwayTeam(awayTeamId);
    }

    return domain;
  }
}
