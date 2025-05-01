import { Injectable, OnModuleInit } from '@nestjs/common';
import { VolleynetSocketService } from './sites/volleynet/volleynet-socket.service';
import { VolleynetService } from './sites/volleynet/volleynet.service';

@Injectable()
export class ParserService implements OnModuleInit {
  constructor(
    private readonly volleynetSocketService: VolleynetSocketService,
    private readonly volleynetService: VolleynetService,
  ) {}

  async onModuleInit() {
    // const match = await this.volleynetSocketService.getMatchInfo(2196970);
    // console.log(`home: ${match.teams.home.name}`);
    // console.log(`away: ${match.teams.away.name}`);

    const competition = await this.volleynetService.processCompetition(
      22,
      'schedule',
    );
    console.log(competition);
  }
}
