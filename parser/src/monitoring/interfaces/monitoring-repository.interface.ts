import { Observable } from 'rxjs';
import { GetMonitoredPlayerIdsDto } from '../dtos/get-monitored-player-ids.dto';
import { PlayerMonitoringDto } from '../dtos/player-to-monitoring-dto';
import { Competition } from '../schemas/competition.schema';
import { Team } from '../schemas/team.schema';

export interface IMonitoringRepository {
  addPlayerToMonitoring(dto: PlayerMonitoringDto): Observable<void>;
  removePlayerFromMonitoring(dto: PlayerMonitoringDto): Observable<void>;
  // getMonitoredCompetitionIds(): Observable<number[]>;
  getMonitoredCompetitions(): Observable<Competition[]>;
  getMonitoredTeams(competitionId: number): Observable<Team[]>;
  getMonitoredPlayerIds(dto: GetMonitoredPlayerIdsDto): Observable<number[]>;
  isPlayerMonitored(dto: PlayerMonitoringDto): Observable<boolean>;
}
