import { Injectable, Logger } from '@nestjs/common';
import { VolleystationCacheService } from '../sites/volleystation/volleystation-cache.service';
import { firstValueFrom } from 'rxjs';
import { InjectQueue } from '@nestjs/bullmq';
import { VolleyJobData } from '../sites/volleystation/types';
import { Queue } from 'bullmq';
import { SCRAPER_QUEUE } from './consts/queue';
import { ttl } from './consts/ttl';
import { priorities } from './consts/priorities';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GetCompeitionDto } from '../sites/volleystation/dtos/get-competition.dto';

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

  async processCompetitions() {
    // await this.cachScraperQueue.resume();
    this.logger.log('Запуск поиска турниров');
    for (let id = 1; id <= 2000; id++) {
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

  async run() {
    this.logger.log('Запуск наполнения кэша');
    const competitions = await firstValueFrom(
      this.volleystationCacheService.getCompetitions(),
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
  async onApplicationBootstrap() {
    // await this.run();
    await this.processCompetitions();
  }
}
