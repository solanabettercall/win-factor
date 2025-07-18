import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Competition } from '../../domain/entities/competition.entity';
import { CompetitionId } from '../../domain/value-objects/competition-id.vo';
import { ICompetitionRepository } from '../../domain/repositories/competition.repository.interface';
import { CompetitionEntity } from '../entities/competition.entity';
import { CompetitionVersion } from '../../domain/value-objects/competition-version.vo';

@Injectable()
export class PostgresCompetitionRepository implements ICompetitionRepository {
  constructor(
    @InjectRepository(CompetitionEntity)
    private readonly competitionRepository: Repository<CompetitionEntity>,
  ) {}

  async findById(id: CompetitionId): Promise<Competition | null> {
    const entity: CompetitionEntity | null =
      await this.competitionRepository.findOne({
        where: { id: id.value },
        relations: {
          teams: true,
          players: true,
          matches: true,
        },
      });

    if (!entity) {
      return null;
    }
    return this.entityToDomain(entity);
  }

  async save(competition: Competition): Promise<void> {
    const entity: CompetitionEntity = this.domainToEntity(competition);

    const existingCompetition = await this.competitionRepository.findOne({
      where: { url: entity.url },
    });

    if (existingCompetition) {
      return;
    }

    await this.competitionRepository.save(entity);
  }

  private domainToEntity(competition: Competition): CompetitionEntity {
    return CompetitionEntity.create({
      id: competition.getId().value,
      name: competition.getName(),
      url: competition.getUrl(),
      version: competition.getVersion().value,
    });
  }

  private entityToDomain(competition: CompetitionEntity): Competition {
    const id = CompetitionId.create(competition.id);
    return Competition.create({
      id,
      name: competition.name,
      url: competition.url,
      version: CompetitionVersion.create(competition.version),
    });
  }
}
