import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MatchService } from '../monitoring/match.service';
import { firstValueFrom } from 'rxjs';
import { CompetitionService } from '../monitoring/competition.service';
import { isToday } from 'date-fns';
import { VolleystationCacheService } from 'src/parser/sites/volleystation/volleystation-cache.service';
import { MonitoringService } from 'src/monitoring/monitoring.service';

@Injectable()
export class MatchWatcherService implements OnModuleInit {
  constructor(
    private readonly matchService: MatchService,
    private readonly competitionService: CompetitionService,
    private readonly monitoringService: MonitoringService,
    private readonly volleystationCacheService: VolleystationCacheService,
  ) {}
  private readonly logger = new Logger(MatchWatcherService.name);

  async onModuleInit() {
    const matches = await firstValueFrom(
      this.matchService.getUpcomingMatches(),
    );
    if (!matches.length) {
      this.logger.log(`Ближайших матчей нет`);
    }
    for (const { competition, event } of matches) {
      const { home, away } = event.teams;

      if (isToday(event.startDate)) {
        const homeTeam = await firstValueFrom(
          this.volleystationCacheService.getTeamByShortId({
            competition,
            shortId: home.code,
          }),
        );
        if (homeTeam) {
          // console.log(homeTeam.players);
          // console.log('--------------------');
          // console.log(home.players);
          for (const player of homeTeam.players) {
            const isMonitored = await firstValueFrom(
              this.monitoringService.isPlayerMonitored({
                competitionId: competition.id,
                playerId: player.id,
                teamId: homeTeam.id,
              }),
            );
            if (isMonitored) {
              this.logger.verbose(`В мониторинге: ${player.name}`);
            }
          }
        }

        break;
      }
    }
  }
}
