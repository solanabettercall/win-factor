import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { VolleystationSocketService } from './sites/volleystation/volleystation-socket.service';
import { VolleystationService } from './sites/volleystation/volleystation.service';
import { RedisService } from 'src/cache/redis.service';
import { VolleystationCacheService } from './sites/volleystation/volleystation-cache.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { competitions } from './sites/volleystation/consts/competitions';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ParserService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ParserService.name);

  constructor(
    private readonly volleystationCacheService: VolleystationCacheService,
    private readonly volleystationService: VolleystationService,
    private readonly redisService: RedisService,
  ) {}

  // @Cron(CronExpression.EVERY_10_SECONDS)
  async onApplicationBootstrap() {
    const competition = competitions.find((c) => c.id === 489);
    const players = await firstValueFrom(
      this.volleystationService.getPlayers(competition),
    );
    console.log(players);
    // // const player = await firstValueFrom(
    // //   this.volleystationCacheService.getPlayer(competition, 2122868),
    // // );
    // // console.log(player);
    // // const detailedMatches = await firstValueFrom(
    // //   this.volleystationCacheService.getDetailedMatches(competition, 'results'),
    // // );
    // // console.log(detailedMatches.map((dm) => dm.officials));
    // const teams = await firstValueFrom(
    //   this.volleystationService.getTeams(competition),
    // );
    // console.log(teams.find((t) => t.name === 'AZS OŚ Toruń'));
    // const teamRoster = await firstValueFrom(
    //   this.volleystationCacheService.getTeamRoster(
    //     competition,
    //     '2189548-3145048',
    //   ),
    // );
    // console.log(teamRoster);
    // const matchId = 2163482;
    // const match = await firstValueFrom(
    //   this.volleystationCacheService.getMatchInfo(2224208),
    // );
    // console.log(match);
    // await this.redisService.setJson<PlayByPlayEvent>(key, match, 360);
    // const cachedMatch = await this.redisService.getJson(key, PlayByPlayEvent);
    // console.log(cachedMatch);
    // const matches = await firstValueFrom(
    //   this.volleystationCacheService.getFullMatchDetails(
    //     competitions[1],
    //     'results',
    //   ),
    // );
    // console.log(matches[0]);
    // console.log(`home: ${match.teams.home.name}`);
    // console.log(`away: ${match.teams.away.name}`);
    // const matches = await firstValueFrom(
    //   this.volleynetService.getMatches(
    //     competitions.find((c) => c.id === 320),
    //     'schedule',
    //   ),
    // );
    // console.log(matches);
    // for (const competition of competitions) {
    //   const matches = await firstValueFrom(
    //     this.volleynetService.getMatches(competition, 'schedule'),
    //   );
    //   this.logger.log(
    //     `[${competition.id}] ${competition.name} [${matches.length}]`,
    //   );
    //   const todayMatches = matches.filter((m) => isToday(m.date));
    //   if (todayMatches.length > 0) {
    //     console.log(todayMatches);
    //     break;
    //   }
    // }
  }
}
