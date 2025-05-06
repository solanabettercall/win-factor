import { Inject, Injectable } from '@nestjs/common';
import { PlayerToMonitoringDto } from './dtos/player-to-monitoring-dto';
import { IPlayerRepository } from './interfaces/player-repository.interface';
import { GetMonitoredPlayerIdsDto } from './dtos/get-monitored-player-ids.dto';
import { PlayerRepositoryToken } from './player-repository.token';

@Injectable()
export class PlayerService {
  constructor(
    @Inject(PlayerRepositoryToken)
    private readonly playerRepository: IPlayerRepository,
  ) {}

  async addToMonitoring(dto: PlayerToMonitoringDto): Promise<void> {
    await this.playerRepository.addPlayerToMonitoring(dto);
  }

  async removeFromMonitoring(dto: PlayerToMonitoringDto): Promise<void> {
    await this.playerRepository.removePlayerFromMonitoring(dto);
  }

  async getMonitoredTournamentIds(): Promise<number[]> {
    return this.playerRepository.getMonitoredTournamentIds();
  }

  async getMonitoredTeamIds(tournamentId: number): Promise<string[]> {
    return this.playerRepository.getMonitoredTeamIds(tournamentId);
  }

  async getMonitoredPlayerIds(
    dto: GetMonitoredPlayerIdsDto,
  ): Promise<number[]> {
    return this.playerRepository.getMonitoredPlayerIds(dto);
  }
}
