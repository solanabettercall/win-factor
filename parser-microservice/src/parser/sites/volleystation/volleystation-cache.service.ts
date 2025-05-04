import { Injectable, Logger } from '@nestjs/common';
import {
  IVolleystationService,
  VolleystationService,
} from './volleystation.service';
import { RedisService } from 'src/cache/redis.service';
import { IVollestationCompetition } from './interfaces/match-list/vollestation-competition.interface';
import { forkJoin, from, Observable, of, switchMap, tap } from 'rxjs';
import {
  IVolleystationSocketService,
  VolleystationSocketService,
} from './volleystation-socket.service';
import { RawMatch } from './models/match-list/raw-match';
import { PlayByPlayEvent } from './models/match-details/play-by-play-event.model';
import { Team } from './models/team-list/team';
import { TeamRoster } from './models/team-roster/team-roster';

// TODO: Сформировать что-то более подходящее
type FullRawMatch = RawMatch & PlayByPlayEvent;

@Injectable()
export class VolleystationCacheService
  implements IVolleystationSocketService, IVolleystationService
{
  private readonly logger = new Logger(VolleystationCacheService.name);

  constructor(
    private readonly volleystationService: VolleystationService,
    private readonly volleystationSocketService: VolleystationSocketService,
    private readonly redisService: RedisService,
  ) {}

  getTeamRoster(
    competition: IVollestationCompetition,
    teamId: string,
  ): Observable<TeamRoster | null> {
    const cacheKey = `volleystation:${competition.id}:team-roster::${teamId}`;
    const TTL = 60 * 30;

    return from(this.redisService.getJson(cacheKey, TeamRoster)).pipe(
      switchMap((cached): Observable<TeamRoster | null> => {
        if (cached && !Array.isArray(cached)) {
          this.logger.debug(`Ростер найден в кэше: ${cacheKey}`);
          return of(cached);
        }

        if (Array.isArray(cached)) {
          this.logger.warn(
            `Ожидался одиночный ростер, но получен массив: ${cacheKey}`,
          );
        }

        this.logger.debug(`Ростер не найден в кэше, загружаем: ${cacheKey}`);

        return this.volleystationService
          .getTeamRoster(competition, teamId)
          .pipe(
            tap(async (roster: TeamRoster | null) => {
              if (roster) {
                try {
                  await this.redisService.setJson(cacheKey, roster, TTL);
                  this.logger.debug(`Ростер сохранён в кэш: ${cacheKey}`);
                } catch (error) {
                  this.logger.warn(
                    `Ошибка при сохранении ростера в кэш: ${error.message}`,
                  );
                }
              } else {
                this.logger.warn(`Пустой ростер, не кэшируем: ${cacheKey}`);
              }
            }),
          );
      }),
    );
  }

  getTeams(competition: IVollestationCompetition): Observable<Team[]> {
    const cacheKey = `volleystation:${competition.id}:teams`;
    const TTL = 60 * 30;

    return from(this.redisService.getJson(cacheKey, Team)).pipe(
      switchMap((cached): Observable<Team[]> => {
        if (Array.isArray(cached)) {
          this.logger.debug(`Команды найдены в кэше: ${cacheKey}`);
          return of(cached);
        }

        if (cached) {
          this.logger.warn(
            `Ожидался массив команд, но получен одиночный объект: ${cacheKey}`,
          );
          return of([cached]);
        }

        this.logger.debug(`Команды не найдены в кэше, загружаем: ${cacheKey}`);

        return this.volleystationService.getTeams(competition).pipe(
          tap(async (teams: Team[]) => {
            try {
              await this.redisService.setJson(cacheKey, teams, TTL);
              this.logger.debug(`Команды сохранены в кэш: ${cacheKey}`);
            } catch (error) {
              this.logger.warn(
                `Ошибка при сохранении команд в кэш: ${error.message}`,
              );
            }
          }),
        );
      }),
    );
  }

  getMatches(
    competition: IVollestationCompetition,
    type: 'results' | 'schedule',
  ): Observable<RawMatch[]> {
    const TTL = 60 * 30;
    const cacheKey = `volleystation:${competition.id}:matches:${type}`;

    return from(this.redisService.getJson(cacheKey, RawMatch)).pipe(
      switchMap((cached): Observable<RawMatch[]> => {
        if (Array.isArray(cached)) {
          this.logger.debug(`Данные найдены в кэше: ${cacheKey}`);
          return of(cached);
        }

        if (cached) {
          this.logger.warn(
            `Ожидался массив, но получен одиночный объект: ${cacheKey}`,
          );
          return of([cached]);
        }

        this.logger.debug(`Данные не найдены в кэше, запрашиваем: ${cacheKey}`);
        return this.volleystationService.getMatches(competition, type).pipe(
          tap(async (matches: RawMatch[]) => {
            try {
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
    const cacheKey = `volleystation:matchInfo:${matchId}`;
    const TTL = 60 * 30;

    return from(this.redisService.getJson(cacheKey, PlayByPlayEvent)).pipe(
      switchMap((cached): Observable<PlayByPlayEvent | null> => {
        if (cached) {
          const data = Array.isArray(cached) ? cached[0] || null : cached;
          this.logger.debug(`Данные для матча ${matchId} найдены в кэше`);
          return of(data);
        }

        this.logger.debug(
          `Данные не найдены в кэше, запрашиваем через сокет: ${cacheKey}`,
        );

        return this.volleystationSocketService.getMatchInfo(matchId).pipe(
          tap(async (matchInfo) => {
            if (matchInfo) {
              try {
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

  getDetailedMatches(
    competition: IVollestationCompetition,
    type: 'results' | 'schedule',
  ): Observable<FullRawMatch[]> {
    const TTL = 60 * 30;
    const cacheKey = `volleystation:${competition.id}:detailedMatches:${type}`;

    return from(this.redisService.getJson(cacheKey, RawMatch)).pipe(
      switchMap((cached): Observable<FullRawMatch[]> => {
        if (Array.isArray(cached)) {
          this.logger.debug(`Данные найдены в кэше: ${cacheKey}`);
          return of(cached.map((match) => ({ ...match }) as FullRawMatch));
        }
        if (cached) {
          this.logger.warn(
            `Ожидался массив, но получен одиночный объект: ${cacheKey}`,
          );
          return of([cached] as FullRawMatch[]);
        }

        this.logger.debug(`Данные не найдены в кэше, запрашиваем: ${cacheKey}`);

        return this.getMatches(competition, type).pipe(
          switchMap((matches) => {
            const matchInfoRequests = matches.map((match) =>
              this.getMatchInfo(match.id).pipe(
                switchMap((matchInfo) =>
                  // Вместо ...null используем ...(matchInfo || {}) для безопасного объединения
                  of({ ...match, ...(matchInfo || {}) } as FullRawMatch),
                ),
              ),
            );
            return forkJoin(matchInfoRequests);
          }),
          tap(async (fullMatches) => {
            try {
              await this.redisService.setJson(cacheKey, fullMatches, TTL);
              this.logger.debug(`Данные для полных матчей сохранены в кэш`);
            } catch (error) {
              this.logger.warn(`Ошибка при сохранении в кэш: ${error.message}`);
            }
          }),
        );
      }),
    );
  }
}
