import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
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
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MatchNotificationCacheService } from './match-notification-cache.service';
import { Cron, CronExpression } from '@nestjs/schedule';

interface NotificationTeamInfo {
  team: TeamRoster;
  onField: Player[];
  onBench: Player[];
  notDeclared: Player[];
}

export interface MatchNotificationPayload {
  competition: ICompetition;
  match: PlayByPlayEvent;
  home: NotificationTeamInfo;
  away: NotificationTeamInfo;
}

@Injectable()
export class MatchWatcherService {
  constructor(
    private readonly matchService: MatchService,
    private readonly competitionService: CompetitionService,
    private readonly monitoringService: MonitoringService,
    private readonly volleystationCacheService: VolleystationCacheService,
    private readonly matchNotificationCacheService: MatchNotificationCacheService,
  ) {}
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

    return { team: teamRoster, onField, onBench, notDeclared };
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async run() {
    const matches = await firstValueFrom(
      this.matchService.getUpcomingMatches(),
    );
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
