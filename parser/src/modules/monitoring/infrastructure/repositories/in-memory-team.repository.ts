import { Injectable } from '@nestjs/common';
import { ITeamRepository } from '../../domain/repositories/team.repository.interface';
import { TeamId } from '../../domain/value-objects/team-id.vo';
import { Team } from '../../domain/entities/team.entity';

@Injectable()
export class ImMemoryTeamRepository implements ITeamRepository {
  private storage: Map<TeamId, Team> = new Map<TeamId, Team>();

  findById(id: TeamId): Promise<Team | null> {
    return Promise.resolve(this.storage.get(id) ?? null);
  }

  save(team: Team): Promise<void> {
    this.storage.set(team.id, team);
    return Promise.resolve();
  }
}
