import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { VolleystationSocketService } from './sites/volleystation/volleystation-socket.service';
import { VolleystationService } from './sites/volleystation/volleystation.service';
import { firstValueFrom, retry } from 'rxjs';
import { competitions } from './sites/volleystation/consts';
import { isToday } from 'date-fns';

@Injectable()
export class ParserService implements OnModuleInit {
  private readonly logger = new Logger(ParserService.name);

  constructor(
    private readonly volleynetSocketService: VolleystationSocketService,
    private readonly volleynetService: VolleystationService,
  ) {}

  async onModuleInit() {
    const match = await this.volleynetSocketService.getMatchInfo(2161023);
    console.log(match);
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
