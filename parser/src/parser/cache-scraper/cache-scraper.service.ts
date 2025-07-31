import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { VolleystationCacheService } from '../sites/volleystation/volleystation-cache.service';
import {
  catchError,
  concatMap,
  EMPTY,
  filter,
  finalize,
  firstValueFrom,
  from,
  lastValueFrom,
  map,
  mergeMap,
  Observable,
  range,
  takeUntil,
  tap,
  timeout,
  timer,
} from 'rxjs';
import { InjectQueue } from '@nestjs/bullmq';
import { MatchListType, VolleyJobData } from '../sites/volleystation/types';
import { Queue } from 'bullmq';
import { SCRAPER_QUEUE } from './consts/queue';
import { ttl } from './consts/ttl';
import { priorities } from './consts/priorities';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GetCompeitionDto } from '../sites/volleystation/dtos/get-competition.dto';
import { CompetitionService } from 'src/monitoring/competition.service';
import { Competition } from 'src/monitoring/schemas/competition.schema';
import { RawMatch } from '../sites/volleystation/models/match-list/raw-match';
import { PlayByPlayEvent } from '../sites/volleystation/models/match-details/play-by-play-event.model';
import { MatchService } from 'src/monitoring/match.service';
import { ICompetition } from '../sites/volleystation/interfaces/vollestation-competition.interface';
import { Player } from '../sites/volleystation/models/team-roster/player';
import { Team } from '../sites/volleystation/models/team-list/team';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export enum JobType {
  COMPETITION = 'competition',
  COMPETITION_INFO = 'competition_info',
  TEAM = 'team',
  PLAYER = 'player',
  MATCH = 'match',
  SCHEDULED_MATCHES = 'scheduled_matches',
  RESULTS_MATCHES = 'results_matches',
  TEAMS = 'teams',
  PLAYERS = 'players',
}

@Injectable()
export class CacheScraperService implements OnApplicationBootstrap {
  private logger = new Logger(CacheScraperService.name);

  constructor(
    private readonly volleystationCacheService: VolleystationCacheService,
    private readonly competitionService: CompetitionService,
    private readonly matchService: MatchService,

    @InjectQueue(SCRAPER_QUEUE)
    private cachScraperQueue: Queue<VolleyJobData>,
  ) {
    this.cachScraperQueue.pause().then();
  }

  async onApplicationBootstrap() {
    // await this.processCompetitions();
  }

  @Cron(CronExpression.EVERY_10_SECONDS, { waitForCompletion: true })
  async processCompetitions() {
    this.logger.log('Запуск поиска турниров');

    const HARD_TIMEOUT = 2 * 60 * 60 * 1000; // 2 часа

    await lastValueFrom(
      range(20, 981).pipe(
        concatMap((id) =>
          this.volleystationCacheService.getCompetition(id).pipe(
            timeout(10000),
            catchError(() => EMPTY),
            concatMap((competition) => {
              if (!competition) {
                this.logger.log(`Турнир не найден [${id}]`);
                return EMPTY;
              }

              return from(
                this.competitionService.createCompetition(competition),
              ).pipe(
                concatMap(() =>
                  this.volleystationCacheService.getTeams(competition).pipe(
                    timeout(10000),
                    concatMap((teams) =>
                      from(teams).pipe(
                        concatMap(({ id: teamId, name }) =>
                          this.volleystationCacheService
                            .getTeam({ competition, teamId })
                            .pipe(
                              timeout(10000),
                              tap((team) => {
                                if (team) {
                                  this.logger.verbose(
                                    `Добавили команду ${name}`,
                                  );
                                }
                              }),
                              catchError(() => EMPTY),
                            ),
                        ),
                      ),
                    ),
                    concatMap(() =>
                      this.volleystationCacheService
                        .getPlayers(competition)
                        .pipe(
                          timeout(10000),
                          concatMap((players) =>
                            from(players).pipe(
                              concatMap(({ id: playerId, name }) =>
                                this.volleystationCacheService
                                  .getPlayer({ competition, playerId })
                                  .pipe(
                                    timeout(10000),
                                    tap((player) => {
                                      if (player) {
                                        this.logger.verbose(
                                          `Добавили игрока ${name}`,
                                        );
                                      }
                                    }),
                                    catchError(() => EMPTY),
                                  ),
                              ),
                            ),
                          ),
                        ),
                    ),
                    concatMap(() =>
                      this.volleystationCacheService
                        .getMatches({
                          competition,
                          type: MatchListType.Schedule,
                        })
                        .pipe(
                          timeout(10000),
                          concatMap((matches) =>
                            from(matches.slice(0, 5)).pipe(
                              concatMap(({ id }) =>
                                this.volleystationCacheService
                                  .getMatchInfo(id)
                                  .pipe(
                                    timeout(10000),
                                    concatMap((matchInfo) =>
                                      matchInfo
                                        ? from(
                                            this.matchService.saveMatch(
                                              competition,
                                              matchInfo,
                                            ),
                                          )
                                        : EMPTY,
                                    ),
                                    catchError(() => EMPTY),
                                  ),
                              ),
                            ),
                          ),
                        ),
                    ),
                  ),
                ),
              );
            }),
          ),
        ),
        takeUntil(timer(HARD_TIMEOUT)),
        finalize(() => {
          this.logger.log(
            'Поиск турниров завершён (или достигнут лимит времени)',
          );
        }),
      ),
    );
  }
}
