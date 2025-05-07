import {
  InjectQueue,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueError,
  OnQueueFailed,
  OnQueuePaused,
  OnQueueProgress,
  OnQueueRemoved,
  OnQueueResumed,
  OnQueueStalled,
  OnQueueWaiting,
  Process,
  Processor,
} from '@nestjs/bull';
import { Job, JobOptions, Queue } from 'bull';
import { Competition } from './models/vollestation-competition';
import { Logger } from '@nestjs/common';
import { JobType } from './volleystation-cache-scraper.service';
import { Team } from './models/team-list/team';
import { Player } from './models/team-roster/player';
import { RawMatch } from './models/match-list/raw-match';
import { VolleystationCacheService } from './volleystation-cache.service';
import { firstValueFrom, from, map, mergeMap } from 'rxjs';
import { JobData } from './types';
import { SCRAPER_QUEUE } from './consts';

@Processor(SCRAPER_QUEUE)
export class CacheScraperProcessor {
  private readonly logger = new Logger(CacheScraperProcessor.name);

  constructor(
    private readonly volleystationCacheService: VolleystationCacheService,
    @InjectQueue(SCRAPER_QUEUE)
    private cachScraperQueue: Queue<JobData>,
  ) {}

  @Process({ name: JobType.COMPETITION, concurrency: 1 })
  async handleParseCompetition(job: Job<Competition>) {
    const { data: competition } = job;
    try {
      this.logger.log(
        `Обработка турнира: [${competition.id}] ${competition.name}`,
      );

      // Ставим задачи на загрузку матчей (результаты и расписание)
      return Promise.all([
        this.cachScraperQueue.add(JobType.RESULTS_MATCHES, competition, {
          priority: 7,
          jobId: `${JobType.RESULTS_MATCHES}:${competition.id}`,
        }),
        this.cachScraperQueue.add(JobType.SCHEDULED_MATCHES, competition, {
          priority: 6,
          jobId: `${JobType.SCHEDULED_MATCHES}:${competition.id}`,
        }),
        this.cachScraperQueue.add(JobType.PLAYERS, competition, {
          priority: 3,
          jobId: `${JobType.PLAYERS}:${competition.id}`,
        }),
        this.cachScraperQueue.add(JobType.TEAMS, competition, {
          priority: 2,
          jobId: `${JobType.TEAMS}:${competition.id}`,
        }),
      ]);
    } catch (error) {
      this.logger.warn(
        `Ошибка при обработке турнира [${competition.id}] ${competition.name}`,
        error,
      );
      throw error;
    }
  }

  @Process({ name: JobType.RESULTS_MATCHES, concurrency: 3 })
  async handleParseResultsMatches(job: Job<Competition>) {
    const { data: competition } = job;
    try {
      this.logger.log(
        `Обработка списка законченных матчей: [${competition.id}] ${competition.name}`,
      );

      const matches = await firstValueFrom(
        this.volleystationCacheService.getMatches(competition, 'results'),
      );

      return this.cachScraperQueue.addBulk(
        matches.map((match) => ({
          name: JobType.MATCH,
          data: match,
          opts: {
            jobId: `${competition.id}:${JobType.MATCH}:${match.id}`,
            priority: 9,
          },
        })),
      );
    } catch (error) {
      this.logger.warn(
        `Ошибка при обработке списка законченных матчей [${competition.id}] ${competition.name}`,
        error,
      );
      throw error;
    }
  }

  @Process({ name: JobType.SCHEDULED_MATCHES, concurrency: 3 })
  async handleParseScheduledMatches(job: Job<Competition>) {
    const { data: competition } = job;
    try {
      this.logger.log(
        `Обработка списка запланированных матчей: [${competition.id}] ${competition.name}`,
      );
      const matches = await firstValueFrom(
        this.volleystationCacheService.getMatches(competition, 'schedule'),
      );

      return this.cachScraperQueue.addBulk(
        matches.map((match) => ({
          name: JobType.MATCH,
          data: match,
          opts: {
            priority: 8,
            jobId: `${competition.id}:${JobType.MATCH}:${match.id}`,
          },
        })),
      );
    } catch (error) {
      this.logger.warn(
        `Ошибка при обработке списка запланированных матчей [${competition.id}] ${competition.name}`,
        error,
      );
      throw error;
    }
  }

  @Process({ name: JobType.TEAMS, concurrency: 3 })
  async handleParseTeams(job: Job<Competition>) {
    const { data: competition } = job;
    try {
      this.logger.log(
        `Обработка списка команд: [${competition.id}] ${competition.name}`,
      );

      const teams = await firstValueFrom(
        this.volleystationCacheService.getTeams(competition),
      );

      return this.cachScraperQueue.addBulk(
        teams.map((team) => ({
          name: JobType.TEAM,
          data: { team, competition },
          opts: {
            priority: 4,
            jobId: `${competition.id}:${JobType.TEAMS}:${team.id}`,
          },
        })),
      );
    } catch (error) {
      this.logger.warn(
        `Ошибка при обработке списка команд [${competition.id}] ${competition.name}`,
        error,
      );
      throw error;
    }
  }

  @Process({ name: JobType.PLAYERS, concurrency: 3 })
  async handleParsePlayers(job: Job<Competition>) {
    const { data: competition } = job;
    try {
      this.logger.log(
        `Обработка списка игроков: [${competition.id}] ${competition.name}`,
      );

      const players = await firstValueFrom(
        this.volleystationCacheService.getPlayers(competition),
      );

      return this.cachScraperQueue.addBulk(
        players.map((player) => ({
          name: JobType.PLAYER,
          data: { player, competition },
          opts: {
            priority: 5,
            jobId: `${competition.id}:${JobType.PLAYERS}:${player.id}`,
          },
        })),
      );
    } catch (error) {
      this.logger.warn(
        `Ошибка при обработке списка игроков [${competition.id}] ${competition.name}`,
        error,
      );
      throw error;
    }
  }

  @Process({ name: JobType.TEAM, concurrency: 3 })
  async handleParseTeam(job: Job<{ team: Team; competition: Competition }>) {
    const { competition, team } = job.data;
    try {
      this.logger.log(`Обработка команды: [${team.id}] ${team.name}`);

      return firstValueFrom(
        this.volleystationCacheService.getTeamRoster(competition, team.id),
      );
    } catch (error) {
      this.logger.warn(
        `Ошибка при обработке команды [${team.id}] ${team.name}`,
        error,
      );
      throw error;
    }
  }

  @Process({ name: JobType.PLAYER, concurrency: 3 })
  async handleParsePlayer(
    job: Job<{ player: Player; competition: Competition }>,
  ) {
    const { competition, player } = job.data;
    try {
      this.logger.log(`Обработка игрока: [${player.id}] ${player.name}`);
      return firstValueFrom(
        this.volleystationCacheService.getPlayer(competition, player.id),
      );
    } catch (error) {
      this.logger.warn(
        `Ошибка при обработке игрока [${player.id}] ${player.name}`,
        error,
      );
      throw error;
    }
  }

  @Process({ name: JobType.MATCH, concurrency: 3 })
  async handleParseMatch(job: Job<RawMatch>) {
    const { data: match } = job;
    try {
      this.logger.log(`Обработка матча: [${match.id}] ${match.matchUrl}`);
      return firstValueFrom(
        this.volleystationCacheService.getMatchInfo(match.id),
      );
    } catch (error) {
      this.logger.warn(
        `Ошибка при обработке матча [${match.id}] ${match.matchUrl}`,
        error,
      );
      throw error;
    }
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.verbose(`Задача ${job.name} с id ${job.id} завершена`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: any) {
    this.logger.warn(
      `Задача ${job.name} с id ${job.id} завершилась с ошибкой:`,
      error,
    );
  }

  @OnQueueWaiting()
  onWaiting(jobId: string) {
    this.logger.verbose(`Задача с id ${jobId} в ожидании`);
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.verbose(`Задача ${job.name} с id ${job.id} взята в обработку`);
  }

  @OnQueueProgress()
  onProgress(job: Job, progress: number | object) {
    this.logger.verbose(
      `Задача ${job.name} с id ${job.id} прогресс: ${JSON.stringify(progress)}`,
    );
  }

  @OnQueueStalled()
  onStalled(job: Job) {
    this.logger.warn(`Задача ${job.name} с id ${job.id} зависла (stalled)`);
  }

  @OnQueueError()
  onError(error: Error) {
    this.logger.error(`Ошибка очереди: ${error.message}`, error.stack);
  }

  @OnQueuePaused()
  onPaused() {
    this.logger.warn(`Очередь приостановлена`);
  }

  @OnQueueResumed()
  onResumed() {
    this.logger.log(`Очередь возобновлена`);
  }

  @OnQueueRemoved()
  onRemoved(job: Job) {
    this.logger.verbose(`Задача ${job.name} с id ${job.id} была удалена`);
  }
}
