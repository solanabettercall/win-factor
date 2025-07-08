import { Team } from '../entities/team.entity';
import { TeamId } from '../value-objects/team-id.vo';

export const TEAM_REPOSITORY = 'ITeamRepository';

export interface ITeamRepository {
  findById(id: TeamId): Promise<Team | null>;
  save(team: Team): Promise<void>;
}
