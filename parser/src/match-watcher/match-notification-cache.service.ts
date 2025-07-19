import { Inject, Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'src/cache/redis.service';
import { MatchNotificationPayload } from './match-watcher.service.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class MatchNotificationCacheService {
  private readonly logger = new Logger(MatchNotificationCacheService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async handleEvent(event: MatchNotificationPayload) {
    const totalRelevant =
      event.home.notDeclared.length +
      event.home.onBench.length +
      event.away.notDeclared.length +
      event.away.onBench.length;

    if (totalRelevant === 0) {
      return;
    }

    const cacheKey = this.buildKey(event);

    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      return;
    }

    await this.redisService.set(cacheKey, cacheKey, 129600); //36 часов

    this.eventEmitter.emit('match.notification', event);
  }

  private buildKey(event: MatchNotificationPayload): string {
    const { competition, match, home, away } = event;

    const makePart = (label: string, players: { number: number }[]) => {
      const sorted = players.map((p) => p.number).sort((a, b) => a - b);
      return `${label}:${sorted.join(',')}`;
    };

    const parts = [
      'match-notification',
      competition.id,
      match.matchId,
      makePart('home-bench', home.onBench),
      makePart('home-nd', home.notDeclared),
      makePart('away-bench', away.onBench),
      makePart('away-nd', away.notDeclared),
    ];

    return parts.join(':');
  }
}
