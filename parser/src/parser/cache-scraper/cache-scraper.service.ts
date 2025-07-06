import { Injectable, Logger } from '@nestjs/common';
import { VolleystationCacheService } from '../sites/volleystation/volleystation-cache.service';
import {
  catchError,
  concatMap,
  EMPTY,
  filter,
  finalize,
  firstValueFrom,
  from,
  map,
  mergeMap,
  Observable,
  tap,
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
export class CacheScraperService {
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

  async onModuleInit() {}

  @Cron(CronExpression.EVERY_30_SECONDS, {
    waitForCompletion: true,
    disabled: true,
  })
  async info() {
    await this.cachScraperQueue.resume();
    const activeJobsCount = await this.cachScraperQueue.getActiveCount();
    this.logger.verbose(`Активных задач: ${activeJobsCount}`);
  }

  @Cron(CronExpression.EVERY_HOUR, {
    waitForCompletion: true,
    disabled: false,
  })
  async processCompetitions() {
    // await this.cachScraperQueue.resume();
    this.logger.log('Запуск поиска турниров');
    for (let id = 1; id <= 1000; id++) {
      const data: Pick<GetCompeitionDto, 'id'> = {
        id,
      };
      await this.cachScraperQueue.add(JobType.COMPETITION_INFO, data, {
        priority: priorities.competition,
        deduplication: {
          id: `${JobType.COMPETITION_INFO}:${id}`,
          ttl: ttl.competition.deduplication(),
        },
        repeat: {
          every: ttl.competition.repeat(),
          key: `${JobType.COMPETITION_INFO}:${id}`,
          immediately: true,
        },
      });
    }
  }

  // @Cron(CronExpression.EVERY_30_SECONDS, {
  //   waitForCompletion: true,
  //   disabled: false,
  // })
  async run() {
    this.logger.log('Запуск наполнения кэша');
    const competitions = await firstValueFrom(
      this.competitionService.getCompetitions(),
    );

    for (const competition of competitions) {
      await this.cachScraperQueue.add(JobType.COMPETITION, competition, {
        priority: priorities.competition,
        deduplication: {
          id: `${JobType.COMPETITION}:${competition.id}`,
          ttl: ttl.competition.deduplication(),
        },
        repeat: {
          every: ttl.competition.repeat(),
          key: `${JobType.COMPETITION}:${competition.id}`,
          immediately: true,
        },
      });
    }
  }

  @Cron(CronExpression.EVERY_30_SECONDS, {
    waitForCompletion: true,
    disabled: false,
  })
  async handlePlayByPlayCron() {
    this.logger.debug('Старт крон-задачи getPlayByPlayEvents');

    await firstValueFrom(
      this.getPlayByPlayEvents().pipe(
        mergeMap(
          ({ competition, event }) =>
            from(this.matchService.saveMatch(competition, event)).pipe(
              catchError((err) => {
                this.logger.error(
                  `Ошибка сохранения матча ${event.matchId}:`,
                  err,
                );
                return EMPTY;
              }),
            ),
          5,
        ),
        finalize(() => {
          this.logger.verbose('Все события сохранены');
        }),
      ),
    );
  }

  getPlayByPlayEvents(): Observable<{
    competition: Competition;
    event: PlayByPlayEvent;
  }> {
    return this.competitionService.getCompetitions().pipe(
      concatMap((competitions) => from(competitions)),
      concatMap((competition) =>
        this.volleystationCacheService
          .getMatches({ competition, type: MatchListType.Schedule })
          .pipe(
            mergeMap((matches) => from(matches)),
            mergeMap((match) =>
              this.volleystationCacheService.getMatchInfo(match.id).pipe(
                filter((info): info is PlayByPlayEvent => !!info),
                map((event) => ({ competition, event })),
              ),
            ),
          ),
      ),
    );
  }

  async onApplicationBootstrap() {
    await this.cachScraperQueue.resume();
    this.processCompetitions();
    this.run();
  }
}
