import { Observable } from 'rxjs';
import { PlayByPlayEvent } from 'src/parser/sites/volleystation/models/match-details/play-by-play-event.model';
import { Competition } from '../schemas/competition.schema';

export interface IMatchRepository {
  upsert(competition: Competition, event: PlayByPlayEvent): Promise<void>;
  get(id: string): Observable<PlayByPlayEvent>;
}
