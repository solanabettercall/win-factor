import { Injectable, Logger } from '@nestjs/common';
import {
  IVolleystationService,
  VolleystationService,
} from './volleystation.service';
import { RedisService } from 'src/cache/redis.service';
import { ICompetition } from './interfaces/vollestation-competition.interface';
import {
  catchError,
  concat,
  defer,
  first,
  forkJoin,
  from,
  map,
  mergeMap,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';
import {
  IVolleystationSocketService,
  VolleystationSocketService,
} from './volleystation-socket.service';
import { RawMatch } from './models/match-list/raw-match';
import { PlayByPlayEvent } from './models/match-details/play-by-play-event.model';
import { Team } from './models/team-list/team';
import { TeamRoster } from './models/team-roster/team-roster';
import { PlayerProfile } from './models/player-profile/player-profile';
import { Player } from './models/team-roster/player';
import { randomInt } from 'crypto';
import { GetPlayerDto } from './dtos/get-player.dto';
import { GetTeamDto } from './dtos/get-team.dto';
import { GetMatchesDto } from './dtos/get-matches.dto';
import { CachableEntityType, ttl } from '../../cache-scraper/consts/ttl';
import { MatchListType } from './types';
import { MatchStatus } from './enums';
import { Competition } from 'src/monitoring/schemas/competition.schema';
import { GetTeamByShortIdDto } from './dtos/get-team-by-short-id.dto';

// TODO: Сформировать что-то более подходящее
type FullRawMatch = RawMatch & PlayByPlayEvent;

function MeasureExecutionTime() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const startTime = performance.now();
      const result = originalMethod.apply(this, args);
      if (result instanceof Observable) {
        return result.pipe(
          tap(() => {
            const endTime = performance.now();
            const executionTime = endTime - startTime;
            const logger = new Logger(target.constructor.name);
            logger.debug(
              `Время выполнения метода ${propertyKey}: ${executionTime.toFixed(2)} мс`,
            );
          }),
        );
      }
      return result;
    };
    return descriptor;
  };
}

@Injectable()
export class VolleystationCacheService implements IVolleystationSocketService {
  private readonly logger = new Logger(VolleystationCacheService.name);

  constructor(
    private readonly volleystationService: VolleystationService,
    private readonly volleystationSocketService: VolleystationSocketService,
    private readonly redisService: RedisService,
  ) {}

  getCompetition(id: number): Observable<ICompetition | null> {
    const ttlValue = ttl.competition.cache();

    const loadVersion = (version: 'v1' | 'v2') => {
      const cacheKey = `volleystation:compeition:${id}:${version}`;

      return from(this.redisService.isNegativeCached(cacheKey)).pipe(
        mergeMap((isNegative) => {
          if (isNegative) {
            return of(null);
          }

          return from(this.redisService.getJson(cacheKey, Competition)).pipe(
            mergeMap((cached) => {
              if (cached && !Array.isArray(cached)) {
                return of(cached);
              }

              if (Array.isArray(cached)) {
                this.logger.warn(
                  `Ожидался объект, но получен массив: ${cacheKey}`,
                );
              }

              this.logger.debug(`Кэш пуст, парсим: ${cacheKey}`);

              return this.volleystationService
                .getCompetition({ id, version })
                .pipe(
                  tap(async (competition) => {
                    try {
                      if (competition) {
                        await this.redisService.setJson(
                          cacheKey,
                          competition,
                          ttlValue,
                        );
                        this.logger.debug(`Турнир сохранён: ${cacheKey}`);
                      } else {
                        await this.redisService.setNegativeCache(
                          cacheKey,
                          ttlValue,
                        );
                      }
                    } catch (e) {
                      this.logger.warn(`Ошибка кэширования: ${e.message}`);
                    }
                  }),
                  catchError((err) => {
                    this.logger.warn(
                      `Ошибка загрузки версии ${version}: ${err.message}`,
                    );
                    return of(null);
                  }),
                );
            }),
          );
        }),
      );
    };

    return concat(
      loadVersion('v1'),
      defer(() => {
        return loadVersion('v2');
      }),
    ).pipe(first((v): v is ICompetition => !!v, null));
  }

  @MeasureExecutionTime()
  getCompetitions(): Observable<Competition[]> {
    const ttlValue = ttl.competitions.cache();
    const cacheKey = 'volleystation:competitions:all';

    return from(this.redisService.getJson(cacheKey, Competition)).pipe(
      switchMap((cached) => {
        if (Array.isArray(cached)) {
          this.logger.debug(`Турниры найдены в кэше: ${cacheKey}`);
          return of(cached);
        }
        if (cached) {
          this.logger.warn(
            `Ожидался массив турниров, но получен одиночный объект: ${cacheKey}`,
          );
          return of([cached]);
        }
        this.logger.debug(
          `Кэша всех турниров нет, сканим Redis по паттернам...`,
        );

        // Сразу два паттерна: v1 и v2
        const patterns: string[] = [
          'volleystation:compeition:*:v1',
          'volleystation:compeition:*:v2',
        ];

        // Параллельно сканим оба паттерна и получаем массив турниров
        return forkJoin(
          patterns.map((p) =>
            from(this.redisService.getJsonByPattern(p, Competition)),
          ),
        ).pipe(
          map((arrays) => arrays.flat()), // сливаем v1+v2
          map((all) => {
            // удаляем дубликаты по id
            const uniq = new Map<number, Competition>();
            all.forEach((c) => uniq.set(c.id, c));
            return Array.from(uniq.values());
          }),
          tap(async (competitions) => {
            try {
              await this.redisService.setJson(cacheKey, competitions, ttlValue);
              this.logger.debug(`Список турниров закэширован: ${cacheKey}`);
            } catch (e) {
              this.logger.warn(
                `Ошибка кэширования списка турниров: ${e.message}`,
              );
            }
          }),
        );
      }),
    );
  }

  getPlayers(competition: ICompetition): Observable<Player[]> {
    const cacheKey = `volleystation:${competition.id}:players`;

    return from(this.redisService.getJson(cacheKey, Player)).pipe(
      switchMap((cached): Observable<Player[]> => {
        if (Array.isArray(cached)) {
          return of(cached);
        }

        if (cached) {
          this.logger.warn(
            `Ожидался массив игроков, но получен одиночный объект: ${cacheKey}`,
          );
          return of([cached]);
        }

        return this.volleystationService.getPlayers(competition).pipe(
          tap(async (players: Player[]) => {
            try {
              const TTL = ttl.players.cache();
              await this.redisService.setJson(cacheKey, players, TTL);
            } catch (error) {
              this.logger.warn(
                `Ошибка при сохранении игроков в кэш: ${error.message}`,
              );
            }
          }),
          catchError((error) => {
            this.logger.error(`Ошибка при загрузке игроков: ${error.message}`);
            return of([] as Player[]);
          }),
        );
      }),
      catchError((error) => {
        this.logger.error(`Неожиданная ошибка в getPlayers: ${error.message}`);
        return of([] as Player[]);
      }),
    );
  }

  getPlayer(dto: GetPlayerDto): Observable<PlayerProfile> {
    const { competition, playerId } = dto;
    const cacheKey = `volleystation:${competition.id}:player:${playerId}`;

    return from(this.redisService.getJson(cacheKey, PlayerProfile)).pipe(
      switchMap((cached): Observable<PlayerProfile | null> => {
        if (cached && !Array.isArray(cached)) {
          return of(cached);
        }

        if (Array.isArray(cached)) {
          this.logger.warn(
            `Ожидался одиночный игрок, но получен массив: ${cacheKey}`,
          );
        }

        return this.volleystationService.getPlayer(dto).pipe(
          tap(async (player: PlayerProfile | null) => {
            if (player) {
              try {
                const TTL = ttl.player.cache();
                await this.redisService.setJson(cacheKey, player, TTL);
              } catch (error) {
                this.logger.warn(
                  `Ошибка при сохранении профиля игрока в кэш: ${error.message}`,
                );
              }
            } else {
              this.logger.warn(`Пустой игрок, не кэшируем: ${cacheKey}`);
            }
          }),
        );
      }),
    );
  }

  getTeam(dto: GetTeamDto): Observable<TeamRoster | null> {
    const { competition, teamId } = dto;
    const cacheKey = `volleystation:${competition.id}:team:${teamId}`;

    return from(this.redisService.getJson(cacheKey, TeamRoster)).pipe(
      switchMap((cached): Observable<TeamRoster | null> => {
        if (cached && !Array.isArray(cached)) {
          return of(cached);
        }

        if (Array.isArray(cached)) {
          this.logger.warn(
            `Ожидалась одиночная команда, но получен массив: ${cacheKey}`,
          );
        }

        this.logger.debug(`Команда не найдена в кэше, загружаем: ${cacheKey}`);

        return this.volleystationService.getTeam(dto).pipe(
          tap(async (roster: TeamRoster | null) => {
            if (roster) {
              try {
                const TTL = ttl.team.cache();

                // Основное сохранение по полному ID
                await this.redisService.setJson(cacheKey, roster, TTL);

                // Дополнительное сохранение по короткому ID
                const idParts = dto.teamId.split('-');
                if (idParts.length > 1) {
                  const shortId = idParts[idParts.length - 1];
                  const shortCacheKey = `volleystation:${competition.id}:team:short:${shortId}`;
                  await this.redisService.setJson(shortCacheKey, roster, TTL);
                }
              } catch (error) {
                this.logger.warn(
                  `Ошибка при сохранении команды в кэш: ${error.message}`,
                );
              }
            } else {
              this.logger.warn(`Пустая команда, не кэшируем: ${cacheKey}`);
            }
          }),
        );
      }),
    );
  }

  getTeamByShortId(dto: GetTeamByShortIdDto): Observable<TeamRoster | null> {
    const { competition, shortId } = dto;
    const cacheKey = `volleystation:${competition.id}:team:short:${shortId}`;

    return from(this.redisService.getJson(cacheKey, TeamRoster)).pipe(
      map((cached) => {
        if (cached && !Array.isArray(cached)) {
          return cached;
        }

        if (Array.isArray(cached)) {
          this.logger.warn(
            `Ожидалась одиночная команда, но получен массив: ${cacheKey}`,
          );
        }

        this.logger.debug(
          `Команда не найдена в кэше по короткому ID: ${cacheKey}`,
        );
        return null;
      }),
      catchError((error) => {
        this.logger.warn(
          `Ошибка при получении команды по короткому ID: ${error.message}`,
        );
        return of(null);
      }),
    );
  }

  getTeams(competition: ICompetition): Observable<Team[]> {
    const cacheKey = `volleystation:${competition.id}:teams`;

    return from(this.redisService.getJson(cacheKey, Team)).pipe(
      switchMap((cached): Observable<Team[]> => {
        if (Array.isArray(cached)) {
          return of(cached);
        }

        if (cached) {
          this.logger.warn(
            `Ожидался массив команд, но получен одиночный объект: ${cacheKey}`,
          );
          return of([cached]);
        }

        return this.volleystationService.getTeams(competition).pipe(
          tap(async (teams: Team[]) => {
            try {
              const TTL = ttl.teams.cache();
              await this.redisService.setJson(cacheKey, teams, TTL);
            } catch (error) {
              this.logger.warn(
                `Ошибка при сохранении команд в кэш: ${error.message}`,
              );
            }
          }),
          // fallback: если getTeams вернул ошибку или ничего не вернул — вернуть пустой массив
          catchError((error) => {
            this.logger.error(`Ошибка при загрузке команд: ${error.message}`);
            return of([] as Team[]);
          }),
        );
      }),
      // fallback: если что-то пошло не так в switchMap — вернуть пустой массив
      catchError((error) => {
        this.logger.error(`Неожиданная ошибка в getTeams: ${error.message}`);
        return of([] as Team[]);
      }),
    );
  }

  getMatches(dto: GetMatchesDto): Observable<RawMatch[]> {
    const { competition, type } = dto;
    const cacheKey = `volleystation:${competition.id}:matches:${type}`;

    return from(this.redisService.getJson(cacheKey, RawMatch)).pipe(
      switchMap((cached): Observable<RawMatch[]> => {
        if (Array.isArray(cached)) {
          // this.logger.debug(`Данные найдены в кэше: ${cacheKey}`);
          return of(cached);
        }

        if (cached) {
          this.logger.warn(
            `Ожидался массив, но получен одиночный объект: ${cacheKey}`,
          );
          return of([cached]);
        }

        this.logger.debug(`Данные не найдены в кэше, запрашиваем: ${cacheKey}`);
        return this.volleystationService.getMatches(dto).pipe(
          tap(async (matches: RawMatch[]) => {
            try {
              const TTL =
                dto.type === MatchListType.Results
                  ? ttl.resultsMatches.cache()
                  : ttl.scheduledMatches.cache();

              await this.redisService.setJson(cacheKey, matches, TTL);
              this.logger.debug(`Данные сохранены в кэш: ${cacheKey}`);
            } catch (error) {
              this.logger.warn(`Ошибка при сохранении в кэш: ${error.message}`);
            }
          }),
        );
      }),
    );
  }

  getMatchInfo(matchId: number): Observable<PlayByPlayEvent | null> {
    const cacheKey = `volleystation:match:${matchId}`;

    return from(this.redisService.getJson(cacheKey, PlayByPlayEvent)).pipe(
      switchMap((cached): Observable<PlayByPlayEvent | null> => {
        if (cached) {
          const data = Array.isArray(cached) ? cached[0] || null : cached;
          // this.logger.debug(`Данные для матча ${matchId} найдены в кэше`);
          return of(data);
        }

        // this.logger.debug(
        //   `Данные не найдены в кэше, запрашиваем через сокет: ${cacheKey}`,
        // );

        return this.volleystationSocketService.getMatchInfo(matchId).pipe(
          tap(async (matchInfo) => {
            if (matchInfo) {
              try {
                const matchStatus = matchInfo.status;

                const matchStatusToCacheTypeMap: Record<
                  MatchStatus,
                  CachableEntityType
                > = {
                  [MatchStatus.Finished]: 'completedMatch',
                  [MatchStatus.Live]: 'onlineMatch',
                  [MatchStatus.Upcoming]: 'scheduledMatch',
                };

                const cacheType =
                  matchStatusToCacheTypeMap[matchStatus] || 'scheduledMatch';

                // Получаем TTL для выбранного типа кеша
                const TTL = ttl[cacheType].cache();

                await this.redisService.setJson(cacheKey, matchInfo, TTL);
                this.logger.debug(
                  `Данные для матча ${matchId} сохранены в кэш`,
                );
              } catch (error) {
                this.logger.warn(
                  `Ошибка при сохранении матча в кэш: ${error.message}`,
                );
              }
            }
          }),
        );
      }),
    );
  }
}
