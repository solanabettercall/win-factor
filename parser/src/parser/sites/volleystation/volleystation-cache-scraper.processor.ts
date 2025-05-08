import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq'; // Обратите внимание на импорты

// import { Job, JobOptions, Queue } from 'bull';
import { Competition } from './models/vollestation-competition';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { JobType } from './volleystation-cache-scraper.service';
import { Team } from './models/team-list/team';
import { Player } from './models/team-roster/player';
import { RawMatch } from './models/match-list/raw-match';
import { VolleystationCacheService } from './volleystation-cache.service';
import { firstValueFrom, from, map, mergeMap } from 'rxjs';
import { JobData } from './types';
import { SCRAPER_QUEUE } from './consts';
import { Job, ParentOpts, Queue } from 'bullmq';

// @Processor(SCRAPER_QUEUE)
// export class CacheScraperProcessor {
//   private readonly logger = new Logger(CacheScraperProcessor.name);

//   constructor(
//     private readonly volleystationCacheService: VolleystationCacheService,
//     @InjectQueue(SCRAPER_QUEUE)
//     private cachScraperQueue: Queue<JobData>,
//   ) {}

//   @Process({ name: JobType.COMPETITION, concurrency: 1 })
//   async handleParseCompetition(job: Job<Competition>) {
//     const { data: competition } = job;
//     try {
//       this.logger.log(
//         `Обработка турнира: [${competition.id}] ${competition.name}`,
//       );

//       // Ставим задачи на загрузку матчей (результаты и расписание)
//       return Promise.all([
//         this.cachScraperQueue.add(JobType.RESULTS_MATCHES, competition, {
//           priority: 7,
//           jobId: `${JobType.RESULTS_MATCHES}:${competition.id}`,
//         }),
//         this.cachScraperQueue.add(JobType.SCHEDULED_MATCHES, competition, {
//           priority: 6,
//           jobId: `${JobType.SCHEDULED_MATCHES}:${competition.id}`,
//         }),
//         this.cachScraperQueue.add(JobType.PLAYERS, competition, {
//           priority: 3,
//           jobId: `${JobType.PLAYERS}:${competition.id}`,
//         }),
//         this.cachScraperQueue.add(JobType.TEAMS, competition, {
//           priority: 2,
//           jobId: `${JobType.TEAMS}:${competition.id}`,
//         }),
//       ]);
//     } catch (error) {
//       this.logger.warn(
//         `Ошибка при обработке турнира [${competition.id}] ${competition.name}`,
//         error,
//       );
//       throw error;
//     }
//   }

//   @Process({ name: JobType.RESULTS_MATCHES, concurrency: 3 })
//   async handleParseResultsMatches(job: Job<Competition>) {
//     const { data: competition } = job;
//     try {
//       this.logger.log(
//         `Обработка списка законченных матчей: [${competition.id}] ${competition.name}`,
//       );

//       const matches = await firstValueFrom(
//         this.volleystationCacheService.getMatches(competition, 'results'),
//       );

//       return this.cachScraperQueue.addBulk(
//         matches.map((match) => ({
//           name: JobType.MATCH,
//           data: match,
//           opts: {
//             jobId: `${competition.id}:${JobType.MATCH}:${match.id}`,
//             priority: 9,
//           },
//         })),
//       );
//     } catch (error) {
//       this.logger.warn(
//         `Ошибка при обработке списка законченных матчей [${competition.id}] ${competition.name}`,
//         error,
//       );
//       throw error;
//     }
//   }

//   @Process({ name: JobType.SCHEDULED_MATCHES, concurrency: 3 })
//   async handleParseScheduledMatches(job: Job<Competition>) {
//     const { data: competition } = job;
//     try {
//       this.logger.log(
//         `Обработка списка запланированных матчей: [${competition.id}] ${competition.name}`,
//       );
//       const matches = await firstValueFrom(
//         this.volleystationCacheService.getMatches(competition, 'schedule'),
//       );

//       return this.cachScraperQueue.addBulk(
//         matches.map((match) => ({
//           name: JobType.MATCH,
//           data: match,
//           opts: {
//             priority: 8,
//             jobId: `${competition.id}:${JobType.MATCH}:${match.id}`,
//           },
//         })),
//       );
//     } catch (error) {
//       this.logger.warn(
//         `Ошибка при обработке списка запланированных матчей [${competition.id}] ${competition.name}`,
//         error,
//       );
//       throw error;
//     }
//   }

//   @Process({ name: JobType.TEAMS, concurrency: 3 })
//   async handleParseTeams(job: Job<Competition>) {
//     const { data: competition } = job;
//     try {
//       this.logger.log(
//         `Обработка списка команд: [${competition.id}] ${competition.name}`,
//       );

//       const teams = await firstValueFrom(
//         this.volleystationCacheService.getTeams(competition),
//       );

//       return this.cachScraperQueue.addBulk(
//         teams.map((team) => ({
//           name: JobType.TEAM,
//           data: { team, competition },
//           opts: {
//             priority: 4,
//             jobId: `${competition.id}:${JobType.TEAMS}:${team.id}`,
//           },
//         })),
//       );
//     } catch (error) {
//       this.logger.warn(
//         `Ошибка при обработке списка команд [${competition.id}] ${competition.name}`,
//         error,
//       );
//       throw error;
//     }
//   }

//   @Process({ name: JobType.PLAYERS, concurrency: 3 })
//   async handleParsePlayers(job: Job<Competition>) {
//     const { data: competition } = job;
//     try {
//       this.logger.log(
//         `Обработка списка игроков: [${competition.id}] ${competition.name}`,
//       );

//       const players = await firstValueFrom(
//         this.volleystationCacheService.getPlayers(competition),
//       );

//       return this.cachScraperQueue.addBulk(
//         players.map((player) => ({
//           name: JobType.PLAYER,
//           data: { player, competition },
//           opts: {
//             priority: 5,
//             jobId: `${competition.id}:${JobType.PLAYERS}:${player.id}`,
//           },
//         })),
//       );
//     } catch (error) {
//       this.logger.warn(
//         `Ошибка при обработке списка игроков [${competition.id}] ${competition.name}`,
//         error,
//       );
//       throw error;
//     }
//   }

//   @Process({ name: JobType.TEAM, concurrency: 3 })
//   async handleParseTeam(job: Job<{ team: Team; competition: Competition }>) {
//     const { competition, team } = job.data;
//     try {
//       this.logger.log(`Обработка команды: [${team.id}] ${team.name}`);

//       return firstValueFrom(
//         this.volleystationCacheService.getTeamRoster(competition, team.id),
//       );
//     } catch (error) {
//       this.logger.warn(
//         `Ошибка при обработке команды [${team.id}] ${team.name}`,
//         error,
//       );
//       throw error;
//     }
//   }

//   @Process({ name: JobType.PLAYER, concurrency: 3 })
//   async handleParsePlayer(
//     job: Job<{ player: Player; competition: Competition }>,
//   ) {
//     const { competition, player } = job.data;
//     try {
//       this.logger.log(`Обработка игрока: [${player.id}] ${player.name}`);
//       return firstValueFrom(
//         this.volleystationCacheService.getPlayer(competition, player.id),
//       );
//     } catch (error) {
//       this.logger.warn(
//         `Ошибка при обработке игрока [${player.id}] ${player.name}`,
//         error,
//       );
//       throw error;
//     }
//   }

//   @Process({ name: JobType.MATCH, concurrency: 3 })
//   async handleParseMatch(job: Job<RawMatch>) {
//     const { data: match } = job;
//     try {
//       this.logger.log(`Обработка матча: [${match.id}] ${match.matchUrl}`);
//       return firstValueFrom(
//         this.volleystationCacheService.getMatchInfo(match.id),
//       );
//     } catch (error) {
//       this.logger.warn(
//         `Ошибка при обработке матча [${match.id}] ${match.matchUrl}`,
//         error,
//       );
//       throw error;
//     }
//   }

//   @OnQueueCompleted()
//   onCompleted(job: Job, result: any) {
//     this.logger.verbose(`Задача ${job.name} с id ${job.id} завершена`);
//   }

//   @OnQueueFailed()
//   onFailed(job: Job, error: any) {
//     this.logger.warn(
//       `Задача ${job.name} с id ${job.id} завершилась с ошибкой:`,
//       error,
//     );
//   }

//   @OnQueueWaiting()
//   onWaiting(jobId: string) {
//     this.logger.verbose(`Задача с id ${jobId} в ожидании`);
//   }

//   @OnQueueActive()
//   onActive(job: Job) {
//     this.logger.verbose(`Задача ${job.name} с id ${job.id} взята в обработку`);
//   }

//   @OnQueueProgress()
//   onProgress(job: Job, progress: number | object) {
//     this.logger.verbose(
//       `Задача ${job.name} с id ${job.id} прогресс: ${JSON.stringify(progress)}`,
//     );
//   }

//   @OnQueueStalled()
//   onStalled(job: Job) {
//     this.logger.warn(`Задача ${job.name} с id ${job.id} зависла (stalled)`);
//   }

//   @OnQueueError()
//   onError(error: Error) {
//     this.logger.error(`Ошибка очереди: ${error.message}`, error.stack);
//   }

//   @OnQueuePaused()
//   onPaused() {
//     this.logger.warn(`Очередь приостановлена`);
//   }

//   @OnQueueResumed()
//   onResumed() {
//     this.logger.log(`Очередь возобновлена`);
//   }

//   @OnQueueRemoved()
//   onRemoved(job: Job) {
//     this.logger.verbose(`Задача ${job.name} с id ${job.id} была удалена`);
//   }
// }

@Processor(SCRAPER_QUEUE)
export class CacheScraperProcessor extends WorkerHost {
  private readonly logger = new Logger(CacheScraperProcessor.name);

  constructor(
    @InjectQueue(SCRAPER_QUEUE) private readonly cacheQueue: Queue<JobData>,
    private readonly volleystationCacheService: VolleystationCacheService,
  ) {
    super();
  }

  async process(job: Job<JobData>): Promise<any> {
    switch (job.name as JobType) {
      case JobType.COMPETITION:
        return this.handleCompetition(job as Job<Competition>);
      case JobType.RESULTS_MATCHES:
      case JobType.SCHEDULED_MATCHES:
        return this.handleMatchList(job as Job<Competition>);
      case JobType.TEAMS:
        return this.handleTeams(job as Job<Competition>);
      case JobType.PLAYERS:
        return this.handlePlayers(job as Job<Competition>);
      case JobType.TEAM:
      case JobType.PLAYER:
      case JobType.MATCH:
        return this.handleEntity(job as Job<any>);
      default:
        throw new Error(`Неизвестный тип задачи ${job.name}`);
    }
  }

  private async handleCompetition(job: Job<Competition>) {
    const competition = job.data;
    this.logger.log(
      `Обработка турнира: [${competition.id}] ${competition.name}`,
    );

    return Promise.all([
      this.cacheQueue.add(JobType.RESULTS_MATCHES, competition, {
        priority: 7,
        deduplication: {
          id: `${JobType.RESULTS_MATCHES}:${competition.id}`,
          ttl: 1000 * 60 * 5,
        },
      }),
      this.cacheQueue.add(JobType.SCHEDULED_MATCHES, competition, {
        priority: 6,
        deduplication: {
          id: `${JobType.SCHEDULED_MATCHES}:${competition.id}`,
          ttl: 1000 * 60 * 5,
        },
      }),
      this.cacheQueue.add(JobType.PLAYERS, competition, {
        priority: 3,
        deduplication: {
          id: `${JobType.PLAYERS}:${competition.id}`,
          ttl: 1000 * 60 * 5,
        },
      }),
      this.cacheQueue.add(JobType.TEAMS, competition, {
        priority: 2,
        deduplication: {
          id: `${JobType.TEAMS}:${competition.id}`,
          ttl: 1000 * 60 * 5,
        },
      }),
    ]);
  }

  private async handleMatchList(job: Job<Competition>) {
    const comp = job.data;
    this.logger.log(`Обработка списка матчей (${job.name}): [${comp.id}]`);
    const type = job.name === JobType.RESULTS_MATCHES ? 'results' : 'schedule';
    const matches = await firstValueFrom(
      this.volleystationCacheService.getMatches(comp, type),
    );
    const parent = { id: job.id, queue: SCRAPER_QUEUE };

    return this.cacheQueue.addBulk(
      matches.map((m: RawMatch) => ({
        name: JobType.MATCH,
        data: m,
        opts: {
          priority: job.name === JobType.RESULTS_MATCHES ? 9 : 8,
          deduplication: { id: `${JobType.MATCH}:${m.id}`, ttl: 60_000 },
        },
      })),
    );
  }

  private async handleTeams(job: Job<Competition>) {
    const comp = job.data;
    this.logger.log(`Обработка команд: [${comp.id}]`);
    const teams = await firstValueFrom(
      this.volleystationCacheService.getTeams(comp),
    );

    return this.cacheQueue.addBulk(
      teams.map((t: Team) => ({
        name: JobType.TEAM,
        data: { team: t, competition: comp },
        opts: {
          priority: 4,
          deduplication: {
            id: `${comp.id}:${JobType.TEAMS}:${t.id}`,
            ttl: 60_000,
          },
        },
      })),
    );
  }

  private async handlePlayers(job: Job<Competition>) {
    const comp = job.data;
    this.logger.log(`Обработка игроков: [${comp.id}]`);
    const players = await firstValueFrom(
      this.volleystationCacheService.getPlayers(comp),
    );

    return this.cacheQueue.addBulk(
      players.map((p: Player) => ({
        name: JobType.PLAYER,
        data: { player: p, competition: comp },
        opts: {
          priority: 5,
          deduplication: {
            id: `${comp.id}:${JobType.PLAYERS}:${p.id}`,
            ttl: 60_000,
          },
        },
      })),
    );
  }

  private async handleEntity(job: Job<any>) {
    this.logger.log(`Обработка ${job.name}: [${job.data.id}]`);
    switch (job.name as JobType) {
      case JobType.TEAM:
        return firstValueFrom(
          this.volleystationCacheService.getTeamRoster(
            job.data.competition,
            job.data.team.id,
          ),
        );
      case JobType.PLAYER:
        return firstValueFrom(
          this.volleystationCacheService.getPlayer(
            job.data.competition,
            job.data.player.id,
          ),
        );
      case JobType.MATCH:
        return firstValueFrom(
          this.volleystationCacheService.getMatchInfo(job.data.id),
        );
      default:
        throw new InternalServerErrorException(`Неизвестный тип: ${job.name}`);
    }
  }
}
