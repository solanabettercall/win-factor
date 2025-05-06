import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Player, PlayerDocument } from './schemas/player.schema';
import { Model } from 'mongoose';
import { GetMonitoredPlayerIdsDto } from './dtos/get-monitored-player-ids.dto';
import { PlayerToMonitoringDto } from './dtos/player-to-monitoring-dto';
import { IPlayerRepository } from './interfaces/player-repository.interface';
import { EMPTY, from, map, mergeMap, Observable, of, tap } from 'rxjs';

@Injectable()
export class PlayerRepository implements IPlayerRepository {
  private readonly logger = new Logger(PlayerRepository.name);

  constructor(
    @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
  ) {}

  addPlayerToMonitoring(dto: PlayerToMonitoringDto): Observable<void> {
    this.logger.debug('addPlayerToMonitoring', dto);
    return from(
      this.playerModel
        .updateOne(
          {
            playerId: dto.playerId,
            teamId: dto.teamId,
            tournamentId: dto.tournamentId,
          },
          { $setOnInsert: dto },
          { upsert: true },
        )
        .exec(),
    ).pipe(map(() => undefined));
  }

  removePlayerFromMonitoring(dto: PlayerToMonitoringDto): Observable<void> {
    this.logger.debug('removePlayerFromMonitoring', dto);
    return from(
      this.playerModel.deleteOne({
        playerId: dto.playerId,
        teamId: dto.teamId,
        tournamentId: dto.tournamentId,
      }),
    ).pipe(
      tap((data) => console.log(data)),
      mergeMap((result: { deletedCount?: number }) => {
        if (!result.deletedCount) {
          const message = 'Игрок не найден';
          this.logger.warn(message, dto);
          // throw new NotFoundException('Игрок не найден');
        }
        return of(undefined);
      }),
    );
  }

  getMonitoredTournamentIds(): Observable<number[]> {
    return from(this.playerModel.distinct('tournamentId').exec());
  }

  getMonitoredTeamIds(tournamentId: number): Observable<string[]> {
    return from(
      this.playerModel.find({ tournamentId }).distinct('teamId').exec(),
    );
  }

  getMonitoredPlayerIds(dto: GetMonitoredPlayerIdsDto): Observable<number[]> {
    return from(
      this.playerModel
        .find({ tournamentId: dto.tournamentId, teamId: dto.teamId })
        .distinct('playerId')
        .exec(),
    );
  }
}
