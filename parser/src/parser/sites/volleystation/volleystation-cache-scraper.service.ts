import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { VolleystationCacheService } from './volleystation-cache.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  catchError,
  concat,
  firstValueFrom,
  forkJoin,
  from,
  mergeMap,
  of,
} from 'rxjs';
import { competitions } from './consts';
import { VolleystationService } from './volleystation.service';
import { ICompetition } from './interfaces/vollestation-competition.interface';

@Injectable()
export class VolleystationCacheScraperService {
  private logger = new Logger(VolleystationCacheScraperService.name);

  constructor(
    private readonly volleystationCacheService: VolleystationCacheService,
    private readonly volleystationService: VolleystationService,
  ) {}

  async addToQueue(entity: unknown, priority?: number) {
    // Тут будет добавление в очередь bull. А он уже будет запрашивать каждую сущность
    throw new NotImplementedException();
  }

  @Cron(CronExpression.EVERY_MINUTE, {
    name: `${VolleystationCacheScraperService.name}`,
    waitForCompletion: true,
    disabled: true,
  })
  async run() {
    this.logger.debug('VolleystationCacheScraperService.run');

    // Получаем список турниров как Observable.
    const competitions$ = this.volleystationCacheService.getCompetitions();

    // Предположим, что getCompetitions() возвращает Observable<any[]>
    competitions$
      .pipe(
        // Обрабатываем турниры последовательно (concurrency = 1). Это позволит позже регулировать параллельность.
        mergeMap(
          (competitions: ICompetition[]) =>
            from(competitions).pipe(
              mergeMap((competition) => {
                // Запускаем параллельное получение данных для турнира.
                return forkJoin({
                  // Приоритет для команд = 1
                  teams: this.volleystationCacheService
                    .getTeams(competition)
                    .pipe(catchError(() => of([]))),
                  // Приоритет для игроков = 2
                  players: this.volleystationCacheService
                    .getPlayers(competition)
                    .pipe(catchError(() => of([]))),
                  // Приоритет для текущих матчей = 3
                  scheduleMatches: this.volleystationCacheService
                    .getMatches(competition, 'schedule')
                    .pipe(catchError(() => of([]))),
                  // Приоритет для прошедших матчей = 4
                  resultsMatches: this.volleystationCacheService
                    .getMatches(competition, 'results')
                    .pipe(catchError(() => of([]))),
                });
              }, /* concurrency для турниров */ 1),
            ),
          1,
        ),
        // После получения данных для турнира добавляем сущности в очередь согласно приоритетам.
        mergeMap(({ teams, players, scheduleMatches, resultsMatches }) => {
          // Используем concat, чтобы гарантированно запускать добавление в нужном порядке
          return concat(
            // Команды – приоритет 1
            from(teams).pipe(
              mergeMap((team) => from(this.addToQueue(team, 1))),
            ),
            // Игроки – приоритет 2
            from(players).pipe(
              mergeMap((player) => from(this.addToQueue(player, 2))),
            ),
            // Текущие матчи – приоритет 3
            from(scheduleMatches).pipe(
              mergeMap((match) => from(this.addToQueue(match, 3))),
            ),
            // Прошедшие матчи – приоритет 4
            from(resultsMatches).pipe(
              mergeMap((match) => from(this.addToQueue(match, 4))),
            ),
          );
        }),
      )
      // Подписываемся, чтобы запустить цепочку
      .subscribe({
        next: () => {},
        error: (err) => this.logger.error('Ошибка в процессе парсинга', err),
        complete: () => this.logger.debug('Парсинг завершён для всех турниров'),
      });
  }
  async onApplicationBootstrap() {
    // await this.run();
  }
}
