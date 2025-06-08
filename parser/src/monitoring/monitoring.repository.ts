import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Monitoring, MonitoringDocument } from './schemas/monitoring.schema';
import { Model, Types } from 'mongoose';
import { GetMonitoredPlayerIdsDto } from './dtos/get-monitored-player-ids.dto';
import { PlayerMonitoringDto } from './dtos/player-to-monitoring-dto';
import { IMonitoringRepository } from './interfaces/monitoring-repository.interface';
import { from, map, mergeMap, Observable, of, switchMap } from 'rxjs';
import { Competition, CompetitionDocument } from './schemas/competition.schema';

@Injectable()
export class MonitoringRepository implements IMonitoringRepository {
  private readonly logger = new Logger(MonitoringRepository.name);

  constructor(
    @InjectModel(Monitoring.name)
    private monitoringModel: Model<MonitoringDocument>,
    @InjectModel(Competition.name)
    private competitionModel: Model<CompetitionDocument>,
  ) {}

  isPlayerMonitored(dto: PlayerMonitoringDto): Observable<boolean> {
    this.logger.debug('isPlayerMonitored', dto);
    return from(
      this.competitionModel.findOne({ id: dto.competitionId }).exec(),
    ).pipe(
      mergeMap((competitionDoc) => {
        if (!competitionDoc) {
          return of(false);
        }
        return from(
          this.monitoringModel.exists({
            playerId: dto.playerId,
            teamId: dto.teamId,
            competition: competitionDoc._id,
          }),
        ).pipe(map((exists) => !!exists));
      }),
    );
  }

  addPlayerToMonitoring(dto: PlayerMonitoringDto): Observable<void> {
    this.logger.debug('addPlayerToMonitoring', dto);
    return from(
      this.competitionModel.findOne({ id: dto.competitionId }).exec(),
    ).pipe(
      mergeMap((competitionDoc) => {
        if (!competitionDoc) {
          throw new NotFoundException(`Турнир ${dto.competitionId} не найден`);
        }
        return from(
          this.monitoringModel
            .updateOne(
              {
                playerId: dto.playerId,
                teamId: dto.teamId,
                competition: competitionDoc._id,
              },
              {
                $setOnInsert: {
                  playerId: dto.playerId,
                  teamId: dto.teamId,
                  competition: competitionDoc._id,
                },
              },
              { upsert: true },
            )
            .exec(),
        ).pipe(map(() => undefined));
      }),
    );
  }

  removePlayerFromMonitoring(dto: PlayerMonitoringDto): Observable<void> {
    this.logger.debug('removePlayerFromMonitoring', dto);
    return from(
      this.competitionModel.findOne({ id: dto.competitionId }).exec(),
    ).pipe(
      mergeMap((competitionDoc) => {
        if (!competitionDoc) {
          // Если турнир не найден, просто выходим без ошибок.
          return of(undefined);
        }
        return from(
          this.monitoringModel.deleteOne({
            playerId: dto.playerId,
            teamId: dto.teamId,
            competition: competitionDoc._id,
          }),
        ).pipe(
          map((result: { deletedCount?: number }) => {
            if (!result.deletedCount) {
              this.logger.warn(
                `При удалении игрока из мониторинга игрок не найден`,
                dto,
              );
              // Можно кинуть NotFoundException, если требуется.
            }
            return undefined;
          }),
        );
      }),
    );
  }

  getMonitoredCompetitions(): Observable<Competition[]> {
    return from(this.monitoringModel.distinct('competition').exec()).pipe(
      switchMap((ids: Types.ObjectId[]) => {
        if (!ids?.length) {
          return of([]);
        }
        return from(
          this.competitionModel.find({ _id: { $in: ids } }).exec(),
        ).pipe(map((docs) => docs as Competition[]));
      }),
    );
  }

  getMonitoredTeamIds(tournamentId: number): Observable<string[]> {
    return from(
      this.competitionModel.findOne({ id: tournamentId }).exec(),
    ).pipe(
      mergeMap((competitionDoc) => {
        if (!competitionDoc) {
          return of([] as string[]);
        }
        return from(
          this.monitoringModel
            .find({ competition: competitionDoc._id })
            .distinct('teamId')
            .exec(),
        );
      }),
    );
  }

  getMonitoredPlayerIds(dto: GetMonitoredPlayerIdsDto): Observable<number[]> {
    return from(
      this.competitionModel.findOne({ id: dto.tournamentId }).exec(),
    ).pipe(
      mergeMap((competitionDoc) => {
        if (!competitionDoc) {
          return of([] as number[]);
        }
        return from(
          this.monitoringModel
            .find({ competition: competitionDoc._id, teamId: dto.teamId })
            .distinct('playerId')
            .exec(),
        );
      }),
    );
  }
}
