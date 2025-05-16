import {
  InjectQueue,
  OnWorkerEvent,
  Processor,
  WorkerHost,
} from '@nestjs/bullmq';
import { Competition } from '../sites/volleystation/models/vollestation-competition';
import { Logger } from '@nestjs/common';
import { JobType } from './cache-scraper.service';
import { RawMatch } from '../sites/volleystation/models/match-list/raw-match';
import { VolleystationCacheService } from '../sites/volleystation/volleystation-cache.service';
import { firstValueFrom } from 'rxjs';
import {
  VolleyJobData,
  MatchListType,
  GetCompetitionByIdDto,
} from '../sites/volleystation/types';
import { Job, Queue } from 'bullmq';
import { GetTeamDto } from '../sites/volleystation/dtos/get-team.dto';
import { GetPlayerDto } from '../sites/volleystation/dtos/get-player.dto';
import { GetMatchesDto } from '../sites/volleystation/dtos/get-matches.dto';
import { SCRAPER_QUEUE } from './consts/queue';
import { ttl } from './consts/ttl';
import { isToday } from 'date-fns';
import { priorities } from './consts/priorities';
import { GetCompeitionDto } from '../sites/volleystation/dtos/get-competition.dto';

@Processor(SCRAPER_QUEUE, { concurrency: 3 })
export class CacheScraperProcessor extends WorkerHost {
  private readonly logger = new Logger(CacheScraperProcessor.name);

  constructor(
    @InjectQueue(SCRAPER_QUEUE)
    private readonly cacheQueue: Queue<VolleyJobData>,
    private readonly volleystationCacheService: VolleystationCacheService,
  ) {
    super();
  }

  async process(job: Job<VolleyJobData>): Promise<any> {
    switch (job.name as JobType) {
      case JobType.COMPETITION:
        return this.handleCompetition(job as Job<Competition>);
      case JobType.COMPETITION_INFO:
        return this.handleCompetitionInfo(job as Job<GetCompetitionByIdDto>);
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
          priority: priorities.resultsMatches,
          deduplication: {
            id: `${JobType.RESULTS_MATCHES}:${competition.id}`,
            ttl: ttl.resultsMatches.deduplication(),
          },
          repeat: {
            every: ttl.resultsMatches.repeat(),
            key: `${JobType.RESULTS_MATCHES}:${competition.id}`,
            immediately: true,
          },
        },
      ),
      this.cacheQueue.add(
        JobType.SCHEDULED_MATCHES,
        { competition, type: MatchListType.Schedule } as GetMatchesDto,
        {
          priority: priorities.scheduledMatches,
          // deduplication: {
          //   id: `${JobType.SCHEDULED_MATCHES}:${competition.id}`,
          //   ttl: 1000 * 60 * 5,
          // },

          deduplication: {
            id: `${JobType.SCHEDULED_MATCHES}:${competition.id}`,
            ttl: ttl.resultsMatches.deduplication(),
          },
          repeat: {
            every: ttl.resultsMatches.repeat(),
            key: `${JobType.SCHEDULED_MATCHES}:${competition.id}`,
            immediately: true,
          },
        },
      ),
      this.cacheQueue.add(JobType.PLAYERS, competition, {
        priority: priorities.players,
        deduplication: {
          id: `${JobType.PLAYERS}:${competition.id}`,
          ttl: ttl.players.deduplication(),
        },
        repeat: {
          every: ttl.players.repeat(),
          key: `${JobType.PLAYERS}:${competition.id}`,
          immediately: true,
        },
      }),
      this.cacheQueue.add(JobType.TEAMS, competition, {
        priority: priorities.teams,
        // deduplication: {
        //   id: `${JobType.TEAMS}:${competition.id}`,
        //   ttl: 1000 * 60 * 5,
        // },

        deduplication: {
          id: `${JobType.TEAMS}:${competition.id}`,
          ttl: ttl.teams.deduplication(),
        },
        repeat: {
          every: ttl.teams.repeat(),
          key: `${JobType.TEAMS}:${competition.id}`,
          immediately: true,
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

    // Собираем все промисы на добавление задач
    const addPromises = matches.map((match, index) => {
      let deduplicationTTL = ttl.scheduledMatch.deduplication();
      let repeatTTL = ttl.scheduledMatch.repeat();
      let priority = priorities.scheduledMatch;
      if (dto.type === MatchListType.Results) {
        deduplicationTTL = ttl.completedMatch.deduplication();
        repeatTTL = ttl.completedMatch.repeat();
        priority = priorities.completedMatch;
      } else if (dto.type === MatchListType.Schedule) {
        deduplicationTTL = ttl.scheduledMatch.deduplication();
        repeatTTL = ttl.scheduledMatch.repeat();
        priority = priorities.scheduledMatch;
      } else if (isToday(match.date) && index === 0) {
        // TODO: По возможности сразу возвращать статус матча с парсера
        deduplicationTTL = ttl.onlineMatch.deduplication();
        repeatTTL = ttl.onlineMatch.repeat();
        priority = priorities.onlineMatch;
      }

      return this.cacheQueue.add(JobType.MATCH, match, {
        priority,
        deduplication: {
          id: `${JobType.MATCH}:${match.id}`,
          ttl: deduplicationTTL,
        },
        repeat: {
          every: repeatTTL,
          key: `${JobType.MATCH}:${match.id}`,
          immediately: true,
        },
      });
    });

    return Promise.all(addPromises);
  }

  @OnWorkerEvent('failed')
  onFail(data) {
    this.logger.error('failed');
    this.logger.error(JSON.stringify(data, null, 2));
  }

  @OnWorkerEvent('error')
  onError(data) {
    this.logger.error('error');
    this.logger.error(JSON.stringify(data, null, 2));
  }

  // @OnWorkerEvent('completed')
  // onCompleted(data) {
  //   this.logger.log('completed');
  //   this.logger.log(JSON.stringify(data, null, 2));
  // }

  private async handleTeams(job: Job<Competition>) {
    const comp = job.data;
    this.logger.log(`Обработка команд: [${comp.id}]`);

    const teams = await firstValueFrom(
      this.volleystationCacheService.getTeams(comp),
    );

    const addPromises = teams.map((team) =>
      this.cacheQueue.add(
        JobType.TEAM,
        { teamId: team.id, competition: comp },
        {
          priority: priorities.team,
          deduplication: {
            id: `${comp.id}:${JobType.TEAMS}:${team.id}`,
            ttl: ttl.team.deduplication(),
          },
          repeat: {
            every: ttl.team.repeat(),
            key: `${comp.id}:${JobType.TEAMS}:${team.id}`,
            immediately: true,
          },
        },
      ),
    );

    return Promise.all(addPromises);
  }

  private async handlePlayers(job: Job<Competition>) {
    const comp = job.data;
    this.logger.log(`Обработка игроков: [${comp.id}]`);

    const players = await firstValueFrom(
      this.volleystationCacheService.getPlayers(comp),
    );

    const addPromises = players.map((player) =>
      this.cacheQueue.add(
        JobType.PLAYER,
        { playerId: player.id, competition: comp },
        {
          priority: priorities.player,
          deduplication: {
            id: `${comp.id}:${JobType.PLAYERS}:${player.id}`,
            ttl: ttl.player.deduplication(),
          },
          repeat: {
            every: ttl.player.repeat(),
            key: `${comp.id}:${JobType.PLAYERS}:${player.id}`,
            immediately: true,
          },
        },
      ),
    );

    return Promise.all(addPromises);
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

  private async handleCompetitionInfo(job: Job<GetCompetitionByIdDto>) {
    const { id } = job.data;
    this.logger.log(`Обработка турнира для проверки: [${id}]`);
    return firstValueFrom(this.volleystationCacheService.getCompetition(id));
  }
}
