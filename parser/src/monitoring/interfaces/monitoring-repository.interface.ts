import { Observable } from 'rxjs';
import { GetMonitoredPlayerIdsDto } from '../dtos/get-monitored-player-ids.dto';
import { PlayerMonitoringDto } from '../dtos/player-to-monitoring-dto';

export interface IMonitoringRepository {
  addPlayerToMonitoring(dto: PlayerMonitoringDto): Observable<void>;
  removePlayerFromMonitoring(dto: PlayerMonitoringDto): Observable<void>;
  getMonitoredCompetitionIds(): Observable<number[]>;
  getMonitoredTeamIds(tournamentId: number): Observable<string[]>;
  getMonitoredPlayerIds(dto: GetMonitoredPlayerIdsDto): Observable<number[]>;
  isPlayerMonitored(dto: PlayerMonitoringDto): Observable<boolean>;
}
