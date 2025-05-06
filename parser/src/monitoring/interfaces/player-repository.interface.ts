import { GetMonitoredPlayerIdsDto } from '../dtos/get-monitored-player-ids.dto';
import { PlayerToMonitoringDto } from '../dtos/player-to-monitoring-dto';

export interface IPlayerRepository {
  addPlayerToMonitoring(dto: PlayerToMonitoringDto): Promise<void>;
  removePlayerFromMonitoring(dto: PlayerToMonitoringDto): Promise<void>;
  getMonitoredTournamentIds(): Promise<number[]>;
  getMonitoredTeamIds(tournamentId: number): Promise<string[]>;
  getMonitoredPlayerIds(dto: GetMonitoredPlayerIdsDto): Promise<number[]>;
}
