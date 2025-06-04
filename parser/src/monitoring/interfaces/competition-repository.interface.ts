import { Observable } from 'rxjs';
import { Competition } from '../schemas/competition.schema';

export interface ICompetitionRepository {
  create(competition: Competition): Observable<Competition>;
  findAll(): Observable<Competition[]>;
  findById(id: number): Observable<Competition | null>;
}
