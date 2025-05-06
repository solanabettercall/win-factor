import { Inject, Injectable } from '@nestjs/common';
import { PlayerToMonitoringDto } from './dtos/player-to-monitoring-dto';
import { IPlayerRepository } from './interfaces/player-repository.interface';
import { GetMonitoredPlayerIdsDto } from './dtos/get-monitored-player-ids.dto';
import { PlayerRepositoryToken } from './player-repository.token';
import { firstValueFrom, Observable } from 'rxjs';

@Injectable()
export class PlayerService {
  constructor(
    @Inject(PlayerRepositoryToken)
    private readonly playerRepository: IPlayerRepository,
  ) {
    const player = {
      playerId: 1,
      teamId: '123423-ABC',
      tournamentId: 123,
    };
    // firstValueFrom(this.addToMonitoring(player)).then().catch();
    firstValueFrom(this.removeFromMonitoring(player)).then().catch();

    // this.removeFromMonitoring(player);
  }

  addToMonitoring(dto: PlayerToMonitoringDto): Observable<void> {
    return this.playerRepository.addPlayerToMonitoring(dto);
  }

  removeFromMonitoring(dto: PlayerToMonitoringDto): Observable<void> {
    return this.playerRepository.removePlayerFromMonitoring(dto);
  }

  getMonitoredTournamentIds(): Observable<number[]> {
    return this.playerRepository.getMonitoredTournamentIds();
  }

  getMonitoredTeamIds(tournamentId: number): Observable<string[]> {
    return this.playerRepository.getMonitoredTeamIds(tournamentId);
  }

  getMonitoredPlayerIds(dto: GetMonitoredPlayerIdsDto): Observable<number[]> {
    return this.playerRepository.getMonitoredPlayerIds(dto);
  }
}
