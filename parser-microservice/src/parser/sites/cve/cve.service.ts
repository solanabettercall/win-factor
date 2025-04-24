import { Injectable, OnModuleInit } from '@nestjs/common';
import { CompetitionService } from './competition.service';
import { CompetitionLink } from './interfaces/competition-link.interface';

@Injectable()
export class CveService implements OnModuleInit {
  constructor(private readonly competitionService: CompetitionService) {}

  async onModuleInit() {
    const competitionLinks: CompetitionLink[] =
      await this.competitionService.parseCompetitionLinks();

    console.log(competitionLinks);
    // await this.competitionService.fetchCompetitionLinks(competitionLinks);
  }
}
