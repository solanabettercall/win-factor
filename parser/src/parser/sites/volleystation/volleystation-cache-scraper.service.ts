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
import { competitions, SCRAPER_QUEUE } from './consts';
import { VolleystationService } from './volleystation.service';
import { ICompetition } from './interfaces/vollestation-competition.interface';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Competition } from './models/vollestation-competition';
import { Team } from './models/team-list/team';
import { Player } from './models/team-roster/player';
import { RawMatch } from './models/match-list/raw-match';
import { JobData, JobTask } from './types';

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
    private readonly volleystationService: VolleystationService,

    @InjectQueue(SCRAPER_QUEUE)
    private cachScraperQueue: Queue<JobData>,
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
  }
  async onApplicationBootstrap() {
    const competitions = await firstValueFrom(
      this.volleystationCacheService.getCompetitions(),
    );

    await this.cachScraperQueue.addBulk(
      competitions.map((competition) => {
        const task: JobTask = {
          name: JobType.COMPETITION,
          data: competition,
          opts: {
            jobId: `${JobType.COMPETITION}:${competition.id}`,
            priority: 1,
          },
        };
        return task;
      }),
    );
  }
}
