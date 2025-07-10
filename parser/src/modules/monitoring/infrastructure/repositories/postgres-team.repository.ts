import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ITeamRepository } from '../../domain/repositories/team.repository.interface';
import { TeamEntity } from '../entities/team.entity';
import { Team } from '../../domain/entities/team.entity';
import { TeamId } from '../../domain/value-objects/team-id.vo';
import { TeamMapper } from '../../application/mappers/team.mapper';

@Injectable()
export class PostgresTeamRepository implements ITeamRepository {
  constructor(
    @InjectRepository(TeamEntity)
    private readonly teamRepository: Repository<TeamEntity>,
  ) {}

  async findById(id: TeamId): Promise<Team | null> {
    const entity = await this.teamRepository.findOne({
      where: {
        code: id.code,
        numeric: id.numeric,
      },
    });

    if (!entity) {
      return null;
    }

    return TeamMapper.fromEntity(entity).toDomain();
  }

  async save(team: Team): Promise<void> {
    const entity = TeamMapper.fromDomain(team).toEntity();
    await this.teamRepository.save(entity);
  }
}
