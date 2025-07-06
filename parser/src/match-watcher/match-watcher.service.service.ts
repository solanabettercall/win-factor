import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleInit,
} from '@nestjs/common';
import { MatchService } from '../monitoring/match.service';
import { firstValueFrom } from 'rxjs';
import { CompetitionService } from '../monitoring/competition.service';
import { isToday } from 'date-fns';
import { VolleystationCacheService } from 'src/parser/sites/volleystation/volleystation-cache.service';
import { MonitoringService } from 'src/monitoring/monitoring.service';
import { Player } from 'src/parser/sites/volleystation/models/team-roster/player';
import { ICompetition } from 'src/parser/sites/volleystation/interfaces/vollestation-competition.interface';
import { PlayByPlayEvent } from 'src/parser/sites/volleystation/models/match-details/play-by-play-event.model';
import { TeamRoster } from 'src/parser/sites/volleystation/models/team-roster/team-roster';
import { MatchNotificationCacheService } from './match-notification-cache.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PlayerProfile } from 'src/parser/sites/volleystation/models/player-profile/player-profile';

export type PlayerWithStatistic = Player &
  Partial<Pick<PlayerProfile, 'statistic'>>;

interface NotificationTeamInfo {
  team: TeamRoster;
  onField: PlayerWithStatistic[];
  onBench: PlayerWithStatistic[];
  notDeclared: PlayerWithStatistic[];
}

export interface MatchNotificationPayload {
  competition: ICompetition;
  match: PlayByPlayEvent;
  home: NotificationTeamInfo;
  away: NotificationTeamInfo;
}

@Injectable()
export class MatchWatcherService implements OnApplicationBootstrap {
  constructor(
    private readonly matchService: MatchService,
    private readonly monitoringService: MonitoringService,
    private readonly volleystationCacheService: VolleystationCacheService,
    private readonly matchNotificationCacheService: MatchNotificationCacheService,
  ) {}

  async onApplicationBootstrap() {
    await this.run();
  }

  private readonly logger = new Logger(MatchWatcherService.name);

  private buildTeamInfo(
    teamRoster: TeamRoster,
    monitored: Player[],
    declaredShirtNumbers: Set<number>,
    startingShirtNumbers: Set<number>,
  ): NotificationTeamInfo {
    // полный объект заявленных из кеша
    const declared = teamRoster.players.filter((p) =>
      declaredShirtNumbers.has(p.number),
    );

    // из них — те, кто в мониторинге
    const declaredMonitored = declared.filter((p) =>
      monitored.some((m) => m.number === p.number),
    );

    // кто вышел на поле
    const onField = declared.filter((p) => startingShirtNumbers.has(p.number));

    // кто остался на скамейке
    const onBench = declaredMonitored.filter(
      (p) => !startingShirtNumbers.has(p.number),
    );

    // из мониторинга те, у кого нет номера в заявке
    const notDeclared = monitored.filter(
      (m) => !declaredShirtNumbers.has(m.number),
    );

    return {
      team: teamRoster,
      onField,
      onBench,
      notDeclared,
    };
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async run() {
    const matches = await firstValueFrom(
      this.matchService.getUpcomingMatches(),
    );
    // const upcomingMatches: UpcomingMatcheDto[] = [];

    // const upcomingMatches = matches
    //   .sort(
    //     (a, b) =>
    //       a.event.startDate.getUTCMilliseconds() -
    //       b.event.startDate.getUTCMilliseconds(),
    //   )
    //   .slice(0, 1);
    // this.logger.debug(`Найдено ${matches.length} матчей сегодня`);
    for (const { competition, event } of matches) {
      if (!isToday(event.startDate)) continue;

      // 1) берём кеши для полной информации об игроках
      const [homeRoster, awayRoster] = await Promise.all([
        firstValueFrom(
          this.volleystationCacheService.getTeamByShortId({
            competition,
            shortId: event.teams.home.code,
          }),
        ),
        firstValueFrom(
          this.volleystationCacheService.getTeamByShortId({
            competition,
            shortId: event.teams.away.code,
          }),
        ),
      ]);
      if (!homeRoster || !awayRoster) break;

      // 2) реальные заявки — из event.teams.home/away.players
      const declaredHomeNums = new Set(
        event.teams.home.players.map((p) => p.shirtNumber),
      );
      const declaredAwayNums = new Set(
        event.teams.away.players.map((p) => p.shirtNumber),
      );

      // 3) стартовые номера первого сета
      const firstSet = event.scout?.sets?.[0] ?? null;
      const homeStartNums = new Set(firstSet?.startingLineup.home ?? []);
      const awayStartNums = new Set(firstSet?.startingLineup.away ?? []);

      // 4) мониторинг
      const [homeMon, awayMon] = await Promise.all([
        firstValueFrom(
          this.monitoringService.getMonitoredPlayers(
            competition,
            homeRoster.id,
          ),
        ),
        firstValueFrom(
          this.monitoringService.getMonitoredPlayers(
            competition,
            awayRoster.id,
          ),
        ),
      ]);

      // 5) собираем инфу по каждой команде
      const homeInfo = this.buildTeamInfo(
        homeRoster,
        homeMon,
        declaredHomeNums,
        homeStartNums,
      );
      const awayInfo = this.buildTeamInfo(
        awayRoster,
        awayMon,
        declaredAwayNums,
        awayStartNums,
      );

      for (const p of awayInfo.onBench) {
        try {
          const player: PlayerProfile | null = await firstValueFrom(
            this.monitoringService.getPlayer({
              competition,
              playerId: p.id,
            }),
          );

          if (player?.statistic) {
            p.statistic = player.statistic;
          }
        } catch (error) {}
      }

      for (const p of awayInfo.notDeclared) {
        try {
          const player: PlayerProfile | null = await firstValueFrom(
            this.monitoringService.getPlayer({
              competition,
              playerId: p.id,
            }),
          );

          if (player?.statistic) {
            p.statistic = player.statistic;
          }
        } catch (error) {}
      }

      for (const p of awayInfo.onField) {
        try {
          const player: PlayerProfile | null = await firstValueFrom(
            this.monitoringService.getPlayer({
              competition,
              playerId: p.id,
            }),
          );

          if (player?.statistic) {
            p.statistic = player.statistic;
          }
        } catch (error) {}
      }

      for (const p of homeInfo.onBench) {
        try {
          const player: PlayerProfile | null = await firstValueFrom(
            this.monitoringService.getPlayer({
              competition,
              playerId: p.id,
            }),
          );

          if (player?.statistic) {
            p.statistic = player.statistic;
          }
        } catch (error) {}
      }

      for (const p of homeInfo.notDeclared) {
        try {
          const player: PlayerProfile | null = await firstValueFrom(
            this.monitoringService.getPlayer({
              competition,
              playerId: p.id,
            }),
          );

          if (player?.statistic) {
            p.statistic = player.statistic;
          }
        } catch (error) {}
      }

      for (const p of homeInfo.onField) {
        try {
          const player: PlayerProfile | null = await firstValueFrom(
            this.monitoringService.getPlayer({
              competition,
              playerId: p.id,
            }),
          );

          if (player?.statistic) {
            p.statistic = player.statistic;
          }
        } catch (error) {}
      }

      // 6) единый payload и вывод в консоль
      const payload: MatchNotificationPayload = {
        competition,
        match: event,
        home: homeInfo,
        away: awayInfo,
      };

      this.matchNotificationCacheService.handleEvent(payload);

      break;
    }
  }
}
