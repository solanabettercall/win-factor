import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ITeamRepository } from '../../domain/repositories/team.repository.interface';
import { TeamEntity } from '../entities/team.entity';
import { Team } from '../../domain/entities/team.entity';
import { TeamId } from '../../domain/value-objects/team-id.vo';
import { CompetitionId } from '../../domain/value-objects/competition-id.vo';
import { CompetitionEntity } from '../entities/competition.entity';
import { PlayerId } from '../../domain/value-objects/player-id.vo';
import { PlayerEntity } from '../entities/player.entity';

@Injectable()
export class PostgresTeamRepository implements ITeamRepository {
  constructor(
    @InjectRepository(TeamEntity)
    private readonly teamRepository: Repository<TeamEntity>,
    @InjectRepository(CompetitionEntity)
    private readonly competitionRepository: Repository<CompetitionEntity>,
    @InjectRepository(PlayerEntity)
    private readonly playerRepository: Repository<PlayerEntity>,
  ) {}

  async findById(id: TeamId): Promise<Team | null> {
    const entity = await this.teamRepository.findOne({
      where: {
        code: id.code,
        numeric: id.numeric,
      },
      relations: {
        competition: true,
        players: true,
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

    const players = await this.playerRepository.find({
      where: {
        id: In(team.getPlayerIds().map((p) => p.value)),
      },
    });

    const entity = TeamEntity.create({
      code: team.getId().code,
      numeric: team.getId().numeric,
      name: team.getName(),
      url: team.getUrl(),
      competition,
    });
    entity.players = players;

    return entity;
  }

  private entityToDomain(team: TeamEntity): Team {
    const id = TeamId.create(team.numeric, team.code);
    const competitionId = CompetitionId.create(team.competition.id);
    return Team.create({
      id,
      name: team.name,
      url: team.url,
      competitionId,
      playerIds: team.players.map((p) => PlayerId.create(p.id)),
    });
  }
}
