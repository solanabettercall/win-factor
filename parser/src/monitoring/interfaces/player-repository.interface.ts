import { Observable } from 'rxjs';
import { Player } from '../schemas/player.schema';

export interface IPlayerRepository {
  upsert(player: Player): Observable<Player>;
  findAll(compeitionId: number): Observable<Player[]>;
  findById(compeitionId: number, id: number): Observable<Player | null>;
}
