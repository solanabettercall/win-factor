import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Competition } from '../../domain/entities/competition.entity';
import { CompetitionId } from '../../domain/value-objects/competition-id.vo';
import { ICompetitionRepository } from '../../domain/repositories/competition.repository.interface';
import { CompetitionEntity } from '../entities/competition.entity';
import { CompetitionMapper } from '../../application/mappers/competition.mapper';

@Injectable()
export class PostgresCompetitionRepository implements ICompetitionRepository {
  constructor(
    @InjectRepository(CompetitionEntity)
    private readonly competitionRepository: Repository<CompetitionEntity>,
  ) {}

  async findById(id: CompetitionId): Promise<Competition | null> {
    const entity = await this.competitionRepository.findOne({
      where: { id: id.value },
      relations: ['teams', 'players'],
    });

    if (!entity) {
      return null;
    }

    return this.mapEntityToDomain(entity);
  }

  async save(competition: Competition): Promise<void> {
    const entity = this.mapDomainToEntity(competition);
    await this.competitionRepository.save(entity);
  }

  private mapEntityToDomain(entity: CompetitionEntity): Competition {
    return CompetitionMapper.entityToDomain(entity);
  }

  private mapDomainToEntity(competition: Competition): CompetitionEntity {
    return CompetitionMapper.domainToEntity(competition);
  }
}
