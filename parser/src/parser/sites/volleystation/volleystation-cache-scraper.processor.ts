import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Competition } from './models/vollestation-competition';
import { Logger } from '@nestjs/common';
import { JobType } from './volleystation-cache-scraper.service';
import { Team } from './models/team-list/team';
import { Player } from './models/team-roster/player';
import { RawMatch } from './models/match-list/raw-match';
import { VolleystationCacheService } from './volleystation-cache.service';
import { firstValueFrom } from 'rxjs';
import { JobData, MatchListType } from './types';
import { Job, Queue } from 'bullmq';
import { GetTeamDto } from './dtos/get-team.dto';
import { GetPlayerDto } from './dtos/get-player.dto';
import { GetMatchesDto } from './dtos/get-matches.dto';
import { SCRAPER_QUEUE } from './consts/queue';
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
        return this.handleMatchList(job as Job<GetMatchesDto>);
      case JobType.TEAMS:
        return this.handleTeams(job as Job<Competition>);
      case JobType.PLAYERS:
        return this.handlePlayers(job as Job<Competition>);
      case JobType.TEAM:
        return this.handleTeam(job as Job<GetTeamDto>);
      case JobType.PLAYER:
        return this.handlePlayer(job as Job<GetPlayerDto>);
      case JobType.MATCH:
        return this.handleMatch(job as Job<RawMatch>);
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
      this.cacheQueue.add(
        JobType.RESULTS_MATCHES,
        { competition, type: MatchListType.Results } as GetMatchesDto,
        {
          priority: 7,
          deduplication: {
            id: `${JobType.RESULTS_MATCHES}:${competition.id}`,
            ttl: 1000 * 60 * 5,
          },
        },
      ),
      this.cacheQueue.add(
        JobType.SCHEDULED_MATCHES,
        { competition, type: MatchListType.Schedule } as GetMatchesDto,
        {
          priority: 6,
          deduplication: {
            id: `${JobType.SCHEDULED_MATCHES}:${competition.id}`,
            ttl: 1000 * 60 * 5,
          },
        },
      ),
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

  private async handleMatchList(job: Job<GetMatchesDto>) {
    const dto = job.data;
    this.logger.log(
      `Обработка списка матчей турнира (${dto.competition.id}): [${dto.type}]`,
    );

    const matches = await firstValueFrom(
      this.volleystationCacheService.getMatches(dto),
    );

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
        data: { teamId: t.id, competition: comp },
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
        data: { playerId: p.id, competition: comp },
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

  private async handleTeam(job: Job<GetTeamDto>) {
    this.logger.log(
      `Обработка команды: [${job.data.teamId}] турнира ${job.data.competition.id}`,
    );

    return firstValueFrom(this.volleystationCacheService.getTeam(job.data));
  }

  private async handlePlayer(job: Job<GetPlayerDto>) {
    this.logger.log(
      `Обработка игрока: [${job.data.playerId}] турнира ${job.data.competition.id}`,
    );

    return firstValueFrom(this.volleystationCacheService.getPlayer(job.data));
  }

  private async handleMatch(job: Job<RawMatch>) {
    this.logger.log(`Обработка матча: [${job.data.id}]`);
    return firstValueFrom(
      this.volleystationCacheService.getMatchInfo(job.data.id),
    );
  }
}
