import { Injectable, OnModuleInit } from '@nestjs/common';
import { VolleystationSocketService } from './sites/volleynet/volleystation-socket.service';
import { VolleystationService } from './sites/volleynet/volleystation.service';

@Injectable()
export class ParserService implements OnModuleInit {
  constructor(
    private readonly volleynetSocketService: VolleystationSocketService,
    private readonly volleynetService: VolleystationService,
  ) {}

  async onModuleInit() {
    const match = await this.volleynetSocketService.getMatchInfo(2216946);
    console.log(match.scout.sets.flatMap((s) => s.events));
    // console.log(`home: ${match.teams.home.name}`);
    // console.log(`away: ${match.teams.away.name}`);

    // const competition = await this.volleynetService.processCompetition(
    //   22,
    //   'results',
    // );
    // console.log(competition);
  }
}
