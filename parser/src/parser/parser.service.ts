import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { VolleystationSocketService } from './sites/volleystation/volleystation-socket.service';
import { VolleystationService } from './sites/volleystation/volleystation.service';
import { RedisService } from 'src/cache/redis.service';
import { VolleystationCacheService } from './sites/volleystation/volleystation-cache.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { competitions } from './sites/volleystation/consts/competitions';
import {
  firstValueFrom,
  forkJoin,
  from,
  last,
  map,
  mergeMap,
  takeWhile,
  tap,
} from 'rxjs';
import { MatchListType } from './sites/volleystation/types';

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
    // const competition = competitions.find((c) => c.id === 25);
    // const competition = competitions.find((c) => c.id === 489);
    // const competition = competitions.find((c) => c.id === 125);
    // const teams = await firstValueFrom(
    //   this.volleystationService.getTeams(competition),
    // );
    // console.log(teams);
    // const competition = await firstValueFrom(
    //   this.volleystationCacheService.getCompetition(1337),
    // );
    // console.log(competition);

    const competitions = await firstValueFrom(
      this.volleystationCacheService.getCompetitions(),
    );
    console.log(competitions[10]);

    // const title = await firstValueFrom(
    //   this.volleystationService.getCompetition(25, 'v1'),
    // );
    // console.log(title);
    // const matches = await firstValueFrom(
    //   this.volleystationService.getMatches({
    //     competition,
    //     type: MatchListType.Results,
    //   }),
    // );
    // console.log(matches[0]);
    // const player = await firstValueFrom(
    //   this.volleystationService.getPlayer({
    //     competition,
    //     playerId: 2205610,
    //   }),
    // );
    // console.log(player);
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
    // from(competitions)
    //   .pipe(
    //     mergeMap(
    //       (competition) => {
    //         const results$ = this.volleystationCacheService.getMatches({
    //           competition,
    //           type: MatchListType.Results,
    //         });
    //         const schedules$ = this.volleystationCacheService.getMatches({
    //           competition,
    //           type: MatchListType.Schedule,
    //         });
    //         return forkJoin([results$, schedules$]).pipe(
    //           map(([resultsMatches, schedulesMatches]) => ({
    //             competition,
    //             resultsMatches,
    //             schedulesMatches,
    //           })),
    //         );
    //       },
    //       5, // 🔁 параллельно максимум 5 запросов
    //     ),
    //     tap(({ competition, resultsMatches, schedulesMatches }) => {
    //       if (resultsMatches.length === 0 && schedulesMatches.length > 0) {
    //         this.logger.verbose(`Нашли: ${competition.url}`);
    //       } else {
    //         this.logger.debug(
    //           `Скип[${competition.id}]: ${resultsMatches.length} ${schedulesMatches.length}`,
    //         );
    //       }
    //     }),
    //     takeWhile(
    //       ({ resultsMatches, schedulesMatches }) =>
    //         !(resultsMatches.length === 0 && schedulesMatches.length > 0),
    //       true, // ✅ включить значение, на котором прерываемся
    //     ),
    //     last(), // получим последний competition перед break
    //   )
    //   .subscribe();
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
