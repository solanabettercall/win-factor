import { Observable } from 'rxjs';
import { PlayByPlayEvent } from 'src/parser/sites/volleystation/models/match-details/play-by-play-event.model';

export interface IMatchRepository {
  upsert(event: PlayByPlayEvent): Promise<void>;
  get(id: string): Observable<PlayByPlayEvent>;
}
