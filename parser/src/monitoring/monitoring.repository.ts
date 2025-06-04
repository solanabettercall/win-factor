import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Monitoring, MonitoringDocument } from './schemas/monitoring.schema';
import { Model, Types } from 'mongoose';
import { GetMonitoredPlayerIdsDto } from './dtos/get-monitored-player-ids.dto';
import { PlayerMonitoringDto } from './dtos/player-to-monitoring-dto';
import { IMonitoringRepository } from './interfaces/monitoring-repository.interface';
import {
  defer,
  from,
  map,
  mergeMap,
  Observable,
  of,
  switchMap,
  throwError,
} from 'rxjs';
import { Competition, CompetitionDocument } from './schemas/competition.schema';
import { Team, TeamDocument } from './schemas/team.schema';
import { Player, PlayerDocument } from './schemas/player.schema';

@Injectable()
export class MonitoringRepository implements IMonitoringRepository {
  private readonly logger = new Logger(MonitoringRepository.name);

  constructor(
    @InjectModel(Monitoring.name)
    private monitoringModel: Model<MonitoringDocument>,
    @InjectModel(Competition.name)
    private competitionModel: Model<CompetitionDocument>,
    @InjectModel(Team.name)
    private teamModel: Model<TeamDocument>,
    @InjectModel(Player.name)
    private playerModel: Model<PlayerDocument>,
  ) {}

  isPlayerMonitored(dto: PlayerMonitoringDto): Observable<boolean> {
    this.logger.debug('isPlayerMonitored', dto);

    return from(
      Promise.all([
        this.competitionModel.findOne({ id: dto.competitionId }).exec(),
        this.teamModel.findOne({ id: dto.teamId }).exec(),
        this.playerModel.findOne({ id: dto.playerId }).exec(),
      ]),
    ).pipe(
      mergeMap(([competitionDoc, teamDoc, playerDoc]) => {
        if (!competitionDoc || !teamDoc || !playerDoc) {
          return of(false);
        }
        return from(
          this.monitoringModel.exists({
            player: playerDoc._id,
            team: teamDoc._id,
            competition: competitionDoc._id,
          }),
        ).pipe(map((exists) => !!exists));
      }),
    );
  }

  addPlayerToMonitoring(dto: PlayerMonitoringDto): Observable<void> {
    this.logger.debug('addPlayerToMonitoring', dto);

    return from(
      Promise.all([
        this.competitionModel.findOne({ id: dto.competitionId }).exec(),
        this.teamModel.findOne({ id: dto.teamId }).exec(),
        this.playerModel.findOne({ id: dto.playerId }).exec(),
      ]),
    ).pipe(
      mergeMap(([competitionDoc, teamDoc, playerDoc]) => {
        // Если какой-то документ не найден, возвращаем Observable с ошибкой
        if (!competitionDoc) {
          return throwError(
            () =>
              new NotFoundException(`Турнир ${dto.competitionId} не найден`),
          );
        }
        if (!teamDoc) {
          return throwError(
            () => new NotFoundException(`Команда ${dto.teamId} не найдена`),
          );
        }
        if (!playerDoc) {
          return throwError(
            () => new NotFoundException(`Игрок ${dto.playerId} не найден`),
          );
        }

        // Все три документа существуют → можем безопасно выполнять upsert
        return from(
          this.monitoringModel
            .updateOne(
              {
                player: playerDoc._id,
                team: teamDoc._id,
                competition: competitionDoc._id,
              },
              {
                $setOnInsert: {
                  player: playerDoc._id,
                  team: teamDoc._id,
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
      Promise.all([
        this.competitionModel.findOne({ id: dto.competitionId }).exec(),
        this.teamModel.findOne({ id: dto.teamId }).exec(),
        this.playerModel.findOne({ id: dto.playerId }).exec(),
      ]),
    ).pipe(
      mergeMap(([competitionDoc, teamDoc, playerDoc]) => {
        if (!competitionDoc || !teamDoc || !playerDoc) {
          return of(undefined);
        }

        return from(
          this.monitoringModel.deleteOne({
            player: playerDoc._id,
            team: teamDoc._id,
            competition: competitionDoc._id,
          }),
        ).pipe(
          map((result: { deletedCount?: number }) => {
            if (!result.deletedCount) {
              this.logger.warn(
                `При удалении игрока из мониторинга игрок не найден`,
                dto,
              );
            }
            return undefined;
          }),
        );
      }),
    );
  }

  getMonitoredCompetitions(): Observable<Competition[]> {
    return defer(() =>
      this.monitoringModel
        .find()
        .populate<{ competition: Competition }>('competition', 'id name url')
        .select('competition -_id')
        .lean()
        .exec(),
    ).pipe(map((docs) => docs.map((d) => d.competition).filter(Boolean)));
  }

  getMonitoredTeams(competitionId: number): Observable<Team[]> {
    return defer(() =>
      this.competitionModel.findOne({ id: competitionId }).lean().exec(),
    ).pipe(
      mergeMap((competition) => {
        if (!competition) return of([]);

        return defer(() =>
          this.monitoringModel
            .find({ competition: competition._id })
            .distinct('team')
            .lean()
            .exec(),
        ).pipe(
          mergeMap((teamIds) =>
            teamIds.length
              ? defer(() =>
                  this.teamModel
                    .find({ _id: { $in: teamIds } })
                    .lean()
                    .exec(),
                )
              : of([]),
          ),
        );
      }),
      map((teams) => teams as Team[]),
    );
  }
}
