import { Injectable, Logger } from '@nestjs/common';
import { VolleystationService } from './volleystation.service';
import { RedisService } from 'src/cache/redis.service';
import { IVollestationCompetition } from './interfaces/match-list/vollestation-competition.interface';
import { forkJoin, from, Observable, of, switchMap, tap } from 'rxjs';
import { VolleystationSocketService } from './volleystation-socket.service';
import { RawMatch } from './models/match-list/raw-match';
import { IPlayByPlayEvent } from './interfaces/match-details/play-by-play-event.interface';
import { PlayByPlayEvent } from './models/match-details/play-by-play-event.model';

// TODO: Сформировать что-то более подходящее
type FullRawMatch = RawMatch & IPlayByPlayEvent;

@Injectable()
export class VolleystationCacheService {
  private readonly logger = new Logger(VolleystationCacheService.name);

  constructor(
    private readonly volleystationService: VolleystationService,
    private readonly volleystationSocketService: VolleystationSocketService,
    private readonly redisService: RedisService,
  ) {}

  getMatches(
    competition: IVollestationCompetition,
    type: 'results' | 'schedule',
  ): Observable<RawMatch[]> {
    const TTL = 60 * 30;
    const cacheKey = `volleystation:${competition.id}:${type}`;

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
    const TTL = 60 * 30; // Время жизни кэша - 30 минут

    return from(this.redisService.getJson(cacheKey, PlayByPlayEvent)).pipe(
      switchMap((cached): Observable<PlayByPlayEvent | null> => {
        if (cached) {
          // Если кэшированное значение — массив, берем первый элемент
          if (Array.isArray(cached)) {
            this.logger.debug(
              `Данные для матча ${matchId} из кэша, массив, берем первый элемент`,
            );
            return of(cached[0] || null); // Возвращаем первый элемент массива или null, если массив пуст
          }
          // Если кэшированное значение одиночный объект
          this.logger.debug(`Данные для матча ${matchId} найдены в кэше`);
          return of(cached); // Возвращаем данные из кэша
        }

        this.logger.debug(
          `Данные не найдены в кэше, запрашиваем через сокет: ${cacheKey}`,
        );

        // Если данных нет в кэше, запрашиваем через сокет
        return from(this.volleystationSocketService.getMatchInfo(matchId)).pipe(
          switchMap((matchInfo) => {
            // Если сервер вернул массив, извлекаем первый элемент
            if (Array.isArray(matchInfo)) {
              return of(matchInfo[0] || null); // Возвращаем первый элемент или null
            }
            return of(matchInfo); // Если сервер вернул одиночный объект, возвращаем его
          }),
          tap(async (matchInfo) => {
            if (matchInfo) {
              try {
                // Сохраняем полученные данные в кэш
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

  getFullMatchDetails(
    competition: IVollestationCompetition,
    type: 'results' | 'schedule',
  ): Observable<FullRawMatch[]> {
    const TTL = 60 * 30;
    const cacheKey = `volleystation:fullMatchDetails:${competition.id}:${type}`;

    return from(this.redisService.getJson(cacheKey, RawMatch)).pipe(
      switchMap((cached): Observable<FullRawMatch[]> => {
        if (Array.isArray(cached)) {
          this.logger.debug(`Данные найдены в кэше: ${cacheKey}`);
          // Приводим к типу FullRawMatch[] (при необходимости, можно добавить проверку)
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
