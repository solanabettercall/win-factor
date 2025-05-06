import { Injectable, Logger } from '@nestjs/common';
import { VolleystationCacheService } from './volleystation-cache.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import { competitions } from './consts';
import { VolleystationService } from './volleystation.service';

@Injectable()
export class VolleystationCacheScraperService {
  private logger = new Logger(VolleystationCacheScraperService.name);

  constructor(
    private readonly volleystationCacheService: VolleystationCacheService,
    private readonly volleystationService: VolleystationService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE, {
    name: `${VolleystationCacheScraperService.name}`,
    waitForCompletion: true,
    disabled: true,
  })
  async run() {
    this.logger.debug('VolleystationCacheScraperService.run');
    const players = await firstValueFrom(
      this.volleystationCacheService.getPlayers(competitions.at(0)),
    );
    console.log(players.length);
  }

  async onApplicationBootstrap() {
    await this.run();
  }
}
