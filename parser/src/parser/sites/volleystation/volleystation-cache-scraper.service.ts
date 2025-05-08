import { Injectable, Logger } from '@nestjs/common';
import { VolleystationCacheService } from './volleystation-cache.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import { InjectQueue } from '@nestjs/bullmq';
import { JobData } from './types';
import { Queue } from 'bullmq';
import { SCRAPER_QUEUE } from './consts/queue';

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
export class VolleystationCacheScraperService {
  private logger = new Logger(VolleystationCacheScraperService.name);

  constructor(
    private readonly volleystationCacheService: VolleystationCacheService,

    @InjectQueue(SCRAPER_QUEUE)
    private cachScraperQueue: Queue<JobData>,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS, {
    name: `${VolleystationCacheScraperService.name}`,
    waitForCompletion: true,
    disabled: false,
  })
  async run() {
    this.logger.log('Запуск наполнения кэша');
    const competitions = await firstValueFrom(
      this.volleystationCacheService.getCompetitions(),
    );

    for (const competition of competitions) {
      await this.cachScraperQueue.add(JobType.COMPETITION, competition, {
        priority: 1,
        deduplication: {
          id: `${JobType.COMPETITION}:${competition.id}`,
          ttl: 1000 * 30,
        },
      });
    }
  }
  async onApplicationBootstrap() {}
}
