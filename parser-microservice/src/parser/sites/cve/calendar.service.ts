import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  from as rxjsFrom,
  mergeMap,
  toArray,
  Observable,
  filter,
  throttleTime,
  retry,
  catchError,
  throwError,
  map,
  tap,
  shareReplay,
  timer,
} from 'rxjs';
import { IMatchInfo } from './interfaces/match-info.interface';
import { MatchInfo } from './entities/match-info.entity';

import {
  addYears,
  eachMonthOfInterval,
  format,
  isAfter,
  isBefore,
  isWithinInterval,
} from 'date-fns';
import { createMatchInfo } from './utils/create-match-info.util';
import {
  IGetCalendarResponse,
  IRawMatch,
} from './interfaces/raw/raw-match.interface';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  private readonly CALENDAR_URL =
    'https://www.cev.eu/umbraco/api/CalendarApi/GetCalendar';

  private readonly MIN_DATE = new Date(1948, 8, 1); // Сентябрь 1948
  private readonly MAX_DATE = addYears(new Date(), 1);
  private readonly CONCURRENCY_LIMIT = 5;

  constructor(private readonly httpService: HttpService) {}

  public getMatchesInRange(from: Date, to: Date): Observable<MatchInfo[]> {
    from = isBefore(from, this.MIN_DATE) ? this.MIN_DATE : from;
    to = isAfter(to, this.MAX_DATE) ? this.MAX_DATE : to;

    if (isAfter(from, to)) {
      const errMessage = `Дата начала (${from}) не может быть позже даты конца (${to})`;
      this.logger.warn(errMessage);
      throw new BadRequestException(errMessage);
    }

    const months = eachMonthOfInterval({ start: from, end: to });

    const allMatches = rxjsFrom(months).pipe(
      mergeMap(
        (monthDate) => this.getMatchesByYearMonth(monthDate),
        this.CONCURRENCY_LIMIT,
      ),
      mergeMap((matches) => matches),
      filter((match) => isWithinInterval(match.date, { start: from, end: to })),
      toArray(),
    );

    return allMatches;
  }

  public getMatchesByYearMonth(date: Date): Observable<IMatchInfo[]> {
    const formattedDate = format(date, 'yyyy-MM-dd');

    return this.httpService
      .get<IGetCalendarResponse>(this.CALENDAR_URL, {
        params: {
          nodeId: 11346,
          culture: 'en-US',
          date: formattedDate,
        },
      })
      .pipe(
        // Троттлинг запросов (не чаще 1 запроса в 500мс)
        throttleTime(500, null, { leading: true, trailing: false }),

        // 3 попытки при ошибках с экспоненциальной задержкой
        retry({
          count: 3,
          delay: (error, retryCount) => {
            const delayMs = Math.pow(2, retryCount) * 1000;
            this.logger.warn(`Попытка ${retryCount} после ${delayMs} мс.`);
            return timer(delayMs);
          },
        }),

        // Основная обработка данных
        map(({ data }) => {
          const rawMatches = data.Dates.flatMap((d) => d.Matches) || [];
          return rawMatches.map((match) => createMatchInfo(match));
        }),

        // Логирование
        tap({
          next: () =>
            this.logger.verbose(`Успешно получены матчи за ${formattedDate}`),
          error: (err) =>
            this.logger.error(`Ошибка при получении матчей: ${err.message}`),
        }),

        // Переиспользование для новых подписчиков
        shareReplay({ bufferSize: 1, refCount: true }),

        // Глобальная обработка ошибок
        catchError((err) => {
          this.logger.error(
            `Критическая ошибка при получении матчей за ${formattedDate}: ${err.stack}`,
          );
          return throwError(
            () => new InternalServerErrorException('Неудалось получить матчи'),
          );
        }),
      );
  }
}
