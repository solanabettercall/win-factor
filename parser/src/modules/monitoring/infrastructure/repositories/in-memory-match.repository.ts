import { Injectable } from '@nestjs/common';
import { IMatchRepository } from '../../domain/repositories/match.repository.interface';
import { MatchId } from '../../domain/value-objects/match-id.vo';
import { Match } from '../../domain/entities/match.entity';

@Injectable()
export class ImMemoryMatchRepository implements IMatchRepository {
  private storage: Map<MatchId, Match> = new Map<MatchId, Match>();

  findById(id: MatchId): Promise<Match | null> {
    return Promise.resolve(this.storage.get(id) ?? null);
  }

  save(match: Match): Promise<void> {
    this.storage.set(match.id, match);
    return Promise.resolve();
  }
}
