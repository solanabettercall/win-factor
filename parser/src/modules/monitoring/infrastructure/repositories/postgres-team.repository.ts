import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ITeamRepository } from '../../domain/repositories/team.repository.interface';
import { TeamEntity } from '../entities/team.entity';
import { Team } from '../../domain/entities/team.entity';
import { TeamId } from '../../domain/value-objects/team-id.vo';
import { CompetitionId } from '../../domain/value-objects/competition-id.vo';
import { CompetitionEntity } from '../entities/competition.entity';

@Injectable()
export class PostgresTeamRepository implements ITeamRepository {
  constructor(
    @InjectRepository(TeamEntity)
    private readonly teamRepository: Repository<TeamEntity>,
    @InjectRepository(CompetitionEntity)
    private readonly competitionRepository: Repository<CompetitionEntity>,
  ) {}

  async findById(id: TeamId): Promise<Team | null> {
    const entity = await this.teamRepository.findOne({
      where: {
        code: id.code,
        numeric: id.numeric,
      },
      relations: {
        competition: true,
      },
    });

    if (!entity) {
      return null;
    }

    return this.entityToDomain(entity);
  }

  async save(team: Team): Promise<void> {
    const entity: TeamEntity = await this.domainToEntity(team);
    await this.teamRepository.save(entity);
  }

  private async domainToEntity(team: Team): Promise<TeamEntity> {
    const competition = await this.competitionRepository.findOneOrFail({
      where: {
        id: team.getCompetitionId().value,
      },
    });
    return TeamEntity.create({
      code: team.getId().code,
      numeric: team.getId().numeric,
      name: team.getName(),
      url: team.getUrl(),
      competition,
    });
  }

  private entityToDomain(team: TeamEntity): Team {
    const id = TeamId.create(team.numeric, team.code);
    const competitionId = CompetitionId.create(team.competition.id);
    return Team.create({
      id,
      name: team.name,
      url: team.url,
      competitionId,
    });
  }
}
