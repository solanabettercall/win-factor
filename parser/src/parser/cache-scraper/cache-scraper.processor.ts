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
import {
  catchError,
  EMPTY,
  filter,
  firstValueFrom,
  from,
  mergeMap,
  switchMap,
  take,
  tap,
} from 'rxjs';
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
import { CompetitionService } from 'src/monitoring/competition.service';
import { ICompetition } from '../sites/volleystation/interfaces/vollestation-competition.interface';
import { TeamService } from 'src/monitoring/team.service';
import { TeamRoster } from '../sites/volleystation/models/team-roster/team-roster';
import { PlayerService } from 'src/monitoring/player.service';
import { Player } from 'src/monitoring/schemas/player.schema';
import { Team } from 'src/monitoring/schemas/team.schema';

@Processor(SCRAPER_QUEUE, { concurrency: 1 })
export class CacheScraperProcessor extends WorkerHost {
  private readonly logger = new Logger(CacheScraperProcessor.name);

  constructor(
    @InjectQueue(SCRAPER_QUEUE)
    private readonly cacheQueue: Queue<VolleyJobData>,
    private readonly volleystationCacheService: VolleystationCacheService,
    private readonly competitionService: CompetitionService,
    private readonly teamService: TeamService,
    private readonly playerService: PlayerService,
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

  private handleTeams(job: Job<Competition>): void {
    const comp = job.data;
    this.logger.log(`Старт обработки команд для турнира [${comp.id}]`);

    this.volleystationCacheService
      .getTeams(comp)
      .pipe(
        take(1),
        switchMap((teams: Team[]) => {
          if (!teams || teams.length === 0) {
            this.logger.debug(`Для турнира [${comp.id}] нет команд`);
            return EMPTY;
          }
          // Преобразуем массив teams в поток отдельных команд
          return from(teams);
        }),

        // Для каждой команды: сразу upsert (createTeam)
        mergeMap((team: Team) =>
          this.teamService.createTeam(team).pipe(
            tap((created: Team) =>
              this.logger.log(
                `Команда [${created.id}] сохранена в БД для турнира [${comp.id}]`,
              ),
            ),
            catchError((err) => {
              this.logger.error(
                `Не удалось сохранить команду [${team.id}] турнира [${comp.id}]: ${err.message}`,
              );
              return EMPTY;
            }),
            // После того, как команда либо успешно создана, либо упала на ошибке, добавляем задачу в очередь
            tap((createdOrEmpty) => {
              // Если createTeam выпал в catchError, т.е. вернул EMPTY, то createdOrEmpty = undefined
              // Тем не менее добавляем задачу в очередь для попытки обновления/обработки
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
              );
            }),
          ),
        ),
      )
      .subscribe({
        complete: () => {
          this.logger.debug(`handleTeams для турнира [${comp.id}] завершён`);
        },
        error: (err) => {
          this.logger.error(
            `Непредвиденная ошибка в handleTeams для турнира [${comp.id}]: ${err}`,
          );
        },
      });
  }

  private handlePlayers(job: Job<Competition>): void {
    const comp = job.data;
    this.logger.log(`Старт обработки игроков для турнира [${comp.id}]`);

    this.volleystationCacheService
      .getPlayers(comp) // Observable<Player[]>
      .pipe(
        take(1), // один раз получить весь массив игроков и завершиться
        switchMap((players: Player[]) => {
          if (!players || players.length === 0) {
            this.logger.debug(`В турнире [${comp.id}] нет игроков`);
            return EMPTY;
          }
          // Разворачиваем массив игроков в поток по одному игроку
          return from(players);
        }),

        // Для каждого player:
        mergeMap((player: Player) =>
          this.playerService.createPlayer(player).pipe(
            // Если успешно upsert, логируем
            tap((created: Player) =>
              this.logger.log(
                `Игрок [${created.id}] сохранён в БД для турнира [${comp.id}]`,
              ),
            ),
            // Если ошибка при сохранении — логируем и "гасим" поток
            catchError((err) => {
              this.logger.error(
                `Не удалось сохранить игрока [${player.id}] турнира [${comp.id}]: ${err.message}`,
              );
              return EMPTY;
            }),
            // После этого (даже если был ошибочный EMPTY) добавляем задачу в очередь
            tap(() => {
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
              );
            }),
          ),
        ),
      )
      .subscribe({
        complete: () => {
          this.logger.debug(`handlePlayers для турнира [${comp.id}] завершён`);
        },
        error: (err) => {
          this.logger.error(
            `Непредвиденная ошибка в handlePlayers для турнира [${comp.id}]: ${err}`,
          );
        },
      });
  }

  private async handleTeam(job: Job<GetTeamDto>): Promise<TeamRoster> {
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

  private handleCompetitionInfo(job: Job<GetCompetitionByIdDto>): void {
    const { id } = job.data;
    this.logger.log(`Обработка турнира для проверки: [${id}]`);

    this.competitionService
      .getCompetitionById(id)
      .pipe(
        take(1),
        filter(
          (comp: ICompetition | null): comp is ICompetition => comp !== null,
        ),
        switchMap((competition: ICompetition) =>
          this.competitionService.createCompetition(competition).pipe(
            tap((created) =>
              this.logger.log(`Турнир сохранён в БД: ${created.id}`),
            ),
            catchError((err) => {
              this.logger.error(
                `Не удалось сохранить турнир ${id}: ${err.message}`,
              );
              return EMPTY;
            }),
          ),
        ),
      )
      .subscribe({
        complete: () => {
          this.logger.debug(`handleCompetitionInfo for [${id}] completed`);
        },
        error: (err) => {
          this.logger.error(
            `Непредвиденная ошибка в handleCompetitionInfo: ${err}`,
          );
        },
      });
  }
}
