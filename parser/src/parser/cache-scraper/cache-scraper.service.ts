import { Injectable, Logger } from '@nestjs/common';
import { VolleystationCacheService } from '../sites/volleystation/volleystation-cache.service';
import { firstValueFrom } from 'rxjs';
import { InjectQueue } from '@nestjs/bullmq';
import { VolleyJobData } from '../sites/volleystation/types';
import { Queue } from 'bullmq';
import { SCRAPER_QUEUE } from './consts/queue';
import { ttl } from './consts/ttl';
import { priorities } from './consts/priorities';

export enum JobType {
  COMPETITION = 'competition',
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
  ) {}

  // @Cron(CronExpression.EVERY_10_SECONDS, {
  //   name: `${VolleystationCacheScraperService.name}`,
  //   waitForCompletion: true,
  //   disabled: false,
  // })
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
    await this.run();
  }
}
