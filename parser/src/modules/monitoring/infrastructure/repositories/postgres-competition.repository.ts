import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Competition } from '../../domain/entities/competition.entity';
import { CompetitionId } from '../../domain/value-objects/competition-id.vo';
import { ICompetitionRepository } from '../../domain/repositories/competition.repository.interface';
import { CompetitionVersion } from '../../domain/value-objects/competition-version.vo';
import { CompetitionEntity } from '../entities/competition.entity';

@Injectable()
export class PostgresCompetitionRepository implements ICompetitionRepository {
  constructor(
    @InjectRepository(CompetitionEntity)
    private readonly competitionRepository: Repository<CompetitionEntity>,
  ) {}

  async findById(id: CompetitionId): Promise<Competition | null> {
    const entity = await this.competitionRepository.findOne({
      where: { id: id.value },
      // relations: ['teams', 'matches'],
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
    return Competition.create({
      id: CompetitionId.create(entity.id),
      name: entity.name,
      url: entity.url,
      version: CompetitionVersion.create(entity.version),
    });
  }

  private mapDomainToEntity(competition: Competition): CompetitionEntity {
    const entity = new CompetitionEntity();
    entity.id = competition.getId().value;
    entity.name = competition.getName();
    entity.url = competition.getUrl();
    entity.version = competition.getVersion().value;
    return entity;
  }
}
