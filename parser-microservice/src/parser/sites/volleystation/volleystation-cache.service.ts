import { Injectable, Logger } from '@nestjs/common';
import { VolleystationService } from './volleystation.service';
import { RedisService } from 'src/cache/redis.service';
import { IVollestationCompetition } from './interfaces/match-list/vollestation-competition.interface';
import { from, Observable, of, switchMap, tap } from 'rxjs';
import { VolleystationSocketService } from './volleystation-socket.service';
import { RawMatch } from './models/match-list/raw-match';

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
          tap(async (matches) => {
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
}
