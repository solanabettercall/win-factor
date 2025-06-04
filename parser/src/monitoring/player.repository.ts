import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Monitoring, MonitoringDocument } from './schemas/monitoring.schema';
import { Model } from 'mongoose';
import { GetMonitoredPlayerIdsDto } from './dtos/get-monitored-player-ids.dto';
import { PlayerMonitoringDto } from './dtos/player-to-monitoring-dto';
import { IMonitoringRepository } from './interfaces/monitoring-repository.interface';
import { from, map, mergeMap, Observable, of, tap } from 'rxjs';

@Injectable()
export class PlayerRepository implements IMonitoringRepository {
  private readonly logger = new Logger(PlayerRepository.name);

  constructor(
    @InjectModel(Monitoring.name)
    private playerModel: Model<MonitoringDocument>,
  ) {}

  isPlayerMonitored(dto: PlayerMonitoringDto): Observable<boolean> {
    this.logger.debug('isPlayerMonitored', dto);
    return from(
      this.playerModel.exists({
        playerId: dto.playerId,
        teamId: dto.teamId,
        competitionId: dto.tournamentId,
      }),
    ).pipe(map((result) => !!result));
  }

  addPlayerToMonitoring(dto: PlayerMonitoringDto): Observable<void> {
    this.logger.debug('addPlayerToMonitoring', dto);
    return from(
      this.playerModel
        .updateOne(
          {
            playerId: dto.playerId,
            teamId: dto.teamId,
            competitionId: dto.tournamentId,
          },
          { $setOnInsert: dto },
          { upsert: true },
        )
        .exec(),
    ).pipe(map(() => undefined));
  }

  removePlayerFromMonitoring(dto: PlayerMonitoringDto): Observable<void> {
    this.logger.debug('removePlayerFromMonitoring', dto);
    return from(
      this.playerModel.deleteOne({
        playerId: dto.playerId,
        teamId: dto.teamId,
        competitionId: dto.tournamentId,
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

  getMonitoredCompetitionIds(): Observable<number[]> {
    return from(this.playerModel.distinct('competitionId').exec());
  }

  getMonitoredTeamIds(tournamentId: number): Observable<string[]> {
    return from(
      this.playerModel
        .find({ competitionId: tournamentId })
        .distinct('teamId')
        .exec(),
    );
  }

  getMonitoredPlayerIds(dto: GetMonitoredPlayerIdsDto): Observable<number[]> {
    return from(
      this.playerModel
        .find({ competitionId: dto.tournamentId, teamId: dto.teamId })
        .distinct('playerId')
        .exec(),
    );
  }
}
