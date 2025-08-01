import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { VolleystationCacheService } from '../sites/volleystation/volleystation-cache.service';
import { CompetitionService } from 'src/monitoring/competition.service';
import { MatchService } from 'src/monitoring/match.service';
import { MatchListType } from '../sites/volleystation/types';
import pLimit from 'p-limit';
import { Competition } from 'src/monitoring/schemas/competition.schema';

@Injectable()
export class CacheScraperService {
  private readonly logger = new Logger(CacheScraperService.name);
  private isProcessing = false;

  private readonly startId = 20;
  private readonly endId = 980;
  private readonly maxMatches = 5;
  private readonly requestTimeout = 10_000;
  private readonly hardTimeout = 2 * 60 * 60 * 1000;
  private readonly concurrency = 5;

  constructor(
    private readonly volleystationCacheService: VolleystationCacheService,
    private readonly competitionService: CompetitionService,
    private readonly matchService: MatchService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async processCompetitions(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.logger.log('Запущена обработка турниров');
    const deadline = Date.now() + this.hardTimeout;

    try {
      const limit = pLimit(this.concurrency);
      const ids = Array.from(
        { length: this.endId - this.startId + 1 },
        (_, i) => i + this.startId,
      );

      for (const id of ids) {
        if (Date.now() > deadline) {
          this.logger.warn('Превышено время обработки: прерываемся');
          break;
        }
        await limit(() => this.handleCompetition(id));
      }
    } catch (err) {
      this.logger.error('Неизвестная ошибка при обработке турниров: ', err);
    } finally {
      this.isProcessing = false;
      this.logger.log('Цикл обработки турниров завершен');
    }
  }

  private async handleCompetition(id: number): Promise<void> {
    try {
      const competition = await this.volleystationCacheService
        .getCompetition(id)
        .toPromise();
      if (!competition) return;
      await this.competitionService.createCompetition(competition);
      this.logger.log(`[${competition.id}] Обработка турнира`);
      await this.processTeams(competition);
      await this.processPlayers(competition);
      await this.processMatches(competition);
    } catch (err) {
      this.logger.error(`[${id}] Ошибка обработки турнира: `, err);
    }
  }

  private async processTeams(competition: Competition): Promise<void> {
    try {
      const teams = await this.volleystationCacheService
        .getTeams(competition)
        .toPromise();
      for (const { id: teamId, name } of teams) {
        try {
          const team = await this.volleystationCacheService
            .getTeam({ competition, teamId })
            .toPromise();
          if (team)
            this.logger.verbose(
              `[${competition.id}] Обработана команда: ${name}`,
            );
        } catch (err) {
          this.logger.error(`Error fetching team ${name}`, err);
        }
      }
    } catch (err) {
      this.logger.error('Error processing teams', err);
    }
  }

  private async processPlayers(competition: Competition): Promise<void> {
    try {
      const players = await this.volleystationCacheService
        .getPlayers(competition)
        .toPromise();
      for (const { id: playerId, name } of players) {
        try {
          const player = await this.volleystationCacheService
            .getPlayer({ competition, playerId })
            .toPromise();
          if (player)
            this.logger.verbose(`[${competition.id}] Обработан игрок: ${name}`);
        } catch (err) {
          this.logger.error(
            `[${competition.id}] Ошибка обработки игрока: ${name}`,
            err,
          );
        }
      }
    } catch (err) {
      this.logger.error(`[${competition.id}] Ошибка обработки игроков: `, err);
    }
  }

  private async processMatches(competition: Competition): Promise<void> {
    try {
      const matches = await this.volleystationCacheService
        .getMatches({ competition, type: MatchListType.Schedule })
        .toPromise();
      for (const raw of matches) {
        try {
          const info = await this.volleystationCacheService
            .getMatchInfo(raw.id)
            .toPromise();
          if (info) {
            await this.matchService.saveMatch(competition, info);
            this.logger.verbose(
              `[${competition.id}] Обработан матч: ${raw.id}`,
            );
          } else {
            this.logger.verbose(
              `[${competition.id}] Подробная информация о матче недоступна: ${raw.id}`,
            );
          }
        } catch (err) {
          this.logger.error(
            `[${competition.id}] Ошибка обработки матча: ${raw.id}`,
            err,
          );
        }
      }
    } catch (err) {
      this.logger.error(`[${competition.id}] Ошибка обработки матчей: `, err);
    }
  }
}
