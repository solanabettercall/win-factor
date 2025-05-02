import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { VolleystationSocketService } from './sites/volleynet/volleystation-socket.service';
import { VolleystationService } from './sites/volleynet/volleystation.service';
import { firstValueFrom, retry } from 'rxjs';
import { competitions } from './sites/volleynet/consts';

@Injectable()
export class ParserService implements OnModuleInit {
  private readonly logger = new Logger(ParserService.name);

  constructor(
    private readonly volleynetSocketService: VolleystationSocketService,
    private readonly volleynetService: VolleystationService,
  ) {}

  async onModuleInit() {
    // const match = await this.volleynetSocketService.getMatchInfo(2161020);
    // console.log(match);
    // console.log(`home: ${match.teams.home.name}`);
    // console.log(`away: ${match.teams.away.name}`);

    const matches = await firstValueFrom(
      this.volleynetService.getMatches(
        competitions.find((c) => c.id === 489),
        'results',
      ),
    );
    console.log(matches[0]);

    // for (const competition of this.volleynetService.competitions) {
    //   const matches = await firstValueFrom(
    //     this.volleynetService.processCompetitionRx(competition, 'results'),
    //   );
    //   this.logger.log(
    //     `[${competition.id}] ${competition.name} [${matches.length}]`,
    //   );
    // }
  }
}
