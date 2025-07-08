import { Competition } from '../entities/competition.entity';
import { CompetitionId } from '../value-objects/competition-id.vo';

export const COMPETITION_REPOSITORY = 'ICompetitionRepository';

export interface ICompetitionRepository {
  findById(id: CompetitionId): Promise<Competition | null>;
  save(competition: Competition): Promise<void>;
}
