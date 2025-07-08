import { Injectable } from '@nestjs/common';
import { Competition } from '../../domain/entities/competition.entity';
import { ICompetitionRepository } from '../../domain/repositories/competition.repository.interface';
import { CompetitionId } from '../../domain/value-objects/competition-id.vo';

@Injectable()
export class ImMemoryCompetitionRepository implements ICompetitionRepository {
  private storage: Map<string, Competition> = new Map<string, Competition>();

  findById(id: CompetitionId): Promise<Competition | null> {
    return Promise.resolve(this.storage.get(id.toString()) ?? null);
  }

  save(competition: Competition): Promise<void> {
    this.storage.set(competition.id.toString(), competition);
    return Promise.resolve();
  }
}
