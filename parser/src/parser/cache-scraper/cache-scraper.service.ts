import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { VolleystationCacheService } from '../sites/volleystation/volleystation-cache.service';
import {
  catchError,
  concatMap,
  EMPTY,
  filter,
  finalize,
  firstValueFrom,
  from,
  lastValueFrom,
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
import { ICompetition } from '../sites/volleystation/interfaces/vollestation-competition.interface';
import { Player } from '../sites/volleystation/models/team-roster/player';
import { Team } from '../sites/volleystation/models/team-list/team';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

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
export class CacheScraperService implements OnApplicationBootstrap {
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

  async onApplicationBootstrap() {
    // await this.processCompetitions();
  }

  @Cron(CronExpression.EVERY_10_SECONDS, { waitForCompletion: true })
  async processCompetitions() {
    this.logger.log('Запуск поиска турниров');
    for (let id = 20; id <= 1000; id++) {
      const competition: ICompetition | null = await lastValueFrom(
        this.volleystationCacheService.getCompetition(id),
      );
      if (competition) {
        await this.competitionService.createCompetition(competition);

        const teams: Team[] = await lastValueFrom(
          this.volleystationCacheService.getTeams(competition),
        );

        for (const { id, name } of teams) {
          const team = await lastValueFrom(
            this.volleystationCacheService.getTeam({ competition, teamId: id }),
          );
          if (team) {
            this.logger.verbose(`Добавили команду ${name}`);
          }
        }

        const players: Player[] = await lastValueFrom(
          this.volleystationCacheService.getPlayers(competition),
        );

        this.logger.log(
          `Добавлен турнир [${competition.id}] ${competition.name} Команд: ${teams.length} Игроков: ${players.length}`,
        );

        const scheduledMatches: RawMatch[] = await lastValueFrom(
          this.volleystationCacheService.getMatches({
            competition,
            type: MatchListType.Schedule,
          }),
        );
        for (const { id } of scheduledMatches.slice(0, 5)) {
          const matchInfo = await lastValueFrom(
            this.volleystationCacheService.getMatchInfo(id),
          );
          if (!matchInfo) {
            continue;
          }
          const formattedDate = format(
            toZonedTime(matchInfo.startDate, 'Europe/Moscow'),
            'dd.MM.yyyy HH:mm',
          );
          this.logger.verbose(
            `Матч ${matchInfo.matchId} дата: ${formattedDate}`,
          );

          await this.matchService.saveMatch(competition, matchInfo);
        }
      } else {
        this.logger.log(`Турнир не найден [${id}]`);
      }
    }
  }
}
