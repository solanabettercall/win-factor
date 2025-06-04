import { Observable } from 'rxjs';
import { PlayerMonitoringDto } from '../dtos/player-to-monitoring-dto';
import { Competition } from '../schemas/competition.schema';
import { Team } from '../schemas/team.schema';

export interface IMonitoringRepository {
  addPlayerToMonitoring(dto: PlayerMonitoringDto): Observable<void>;
  removePlayerFromMonitoring(dto: PlayerMonitoringDto): Observable<void>;
  getMonitoredCompetitions(): Observable<Competition[]>;
  getMonitoredTeams(competitionId: number): Observable<Team[]>;
  isPlayerMonitored(dto: PlayerMonitoringDto): Observable<boolean>;
}
