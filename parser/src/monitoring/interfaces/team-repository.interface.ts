import { Observable } from 'rxjs';
import { Team } from '../schemas/team.schema';

export interface ITeamRepository {
  upsert(competition: Team): Observable<Team>;
  findAll(compeitionId: number): Observable<Team[]>;
  findById(compeitionId: number, id: string): Observable<Team | null>;
}
