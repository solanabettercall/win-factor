import { Observable } from 'rxjs';
import { GetMonitoredPlayerIdsDto } from '../dtos/get-monitored-player-ids.dto';
import { PlayerToMonitoringDto } from '../dtos/player-to-monitoring-dto';

export interface IPlayerRepository {
  addPlayerToMonitoring(dto: PlayerToMonitoringDto): Observable<void>;
  removePlayerFromMonitoring(dto: PlayerToMonitoringDto): Observable<void>;
  getMonitoredTournamentIds(): Observable<number[]>;
  getMonitoredTeamIds(tournamentId: number): Observable<string[]>;
  getMonitoredPlayerIds(dto: GetMonitoredPlayerIdsDto): Observable<number[]>;
}
