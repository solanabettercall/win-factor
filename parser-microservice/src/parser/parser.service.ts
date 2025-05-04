import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { VolleystationSocketService } from './sites/volleystation/volleystation-socket.service';
import { VolleystationService } from './sites/volleystation/volleystation.service';
import { firstValueFrom } from 'rxjs';
import { competitions } from './sites/volleystation/consts';
import { RedisService } from 'src/cache/redis.service';
import { VolleystationCacheService } from './sites/volleystation/volleystation-cache.service';

@Injectable()
export class ParserService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ParserService.name);

  constructor(
    private readonly volleynetSocketService: VolleystationSocketService,
    private readonly volleynetService: VolleystationService,
    private readonly volleystationCacheService: VolleystationCacheService,
    private readonly redisService: RedisService,
  ) {}

  async onApplicationBootstrap() {
    // const matchId = 2161023;
    // const key = `match:${matchId}`;
    // const match = await this.volleynetSocketService.getMatchInfo(matchId);
    // console.log(match);
    // await this.redisService.setJson<PlayByPlayEvent>(key, match, 360);

    // const cachedMatch = await this.redisService.getJson(key, PlayByPlayEvent);
    // console.log(cachedMatch);
    // console.log(cachedMatch);

    const matches = await firstValueFrom(
      this.volleystationCacheService.getMatches(
        competitions.find((c) => c.id === 320),
        'schedule',
      ),
    );
    console.log(matches[0]);
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
