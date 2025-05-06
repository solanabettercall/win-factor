import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Player, PlayerDocument } from './schemas/player.schema';
import { Model } from 'mongoose';
import { GetMonitoredPlayerIdsDto } from './dtos/get-monitored-player-ids.dto';
import { PlayerToMonitoringDto } from './dtos/player-to-monitoring-dto';
import { IPlayerRepository } from './interfaces/player-repository.interface';

@Injectable()
export class PlayerRepository implements IPlayerRepository {
  private readonly logger = new Logger(PlayerRepository.name);

  constructor(
    @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
  ) {}

  async addPlayerToMonitoring(dto: PlayerToMonitoringDto): Promise<void> {
    const exists = await this.playerModel.exists({
      playerId: dto.playerId,
      teamId: dto.teamId,
      tournamentId: dto.tournamentId,
    });

    if (!exists) {
      await this.playerModel.create(dto);
    }
  }

  async removePlayerFromMonitoring(dto: PlayerToMonitoringDto): Promise<void> {
    await this.playerModel
      .deleteOne({
        playerId: dto.playerId,
        teamId: dto.teamId,
        tournamentId: dto.tournamentId,
      })
      .exec();
  }

  async getMonitoredTournamentIds(): Promise<number[]> {
    this.logger.debug('getMonitoredTournamentIds');
    const result = await this.playerModel.distinct('tournamentId').exec();
    return result;
  }

  async getMonitoredTeamIds(tournamentId: number): Promise<string[]> {
    const result = await this.playerModel
      .find({ tournamentId })
      .distinct('teamId')
      .exec();
    return result;
  }

  async getMonitoredPlayerIds(
    dto: GetMonitoredPlayerIdsDto,
  ): Promise<number[]> {
    const result = await this.playerModel
      .find({ tournamentId: dto.tournamentId, teamId: dto.teamId })
      .distinct('playerId')
      .exec();
    return result;
  }
}
