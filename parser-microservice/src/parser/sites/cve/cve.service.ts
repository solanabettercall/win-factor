import { Injectable, OnModuleInit } from '@nestjs/common';
import { CompetitionService } from './competition.service';
import { CompetitionLink } from './interfaces/competition-link.interface';
import { CalendarService } from './calendar.service';

@Injectable()
export class CveService implements OnModuleInit {
  constructor(
    private readonly competitionService: CompetitionService,
    private readonly calendarService: CalendarService,
  ) {}

  async onModuleInit() {
    // const competitionLinks: CompetitionLink[] =
    // await this.competitionService.parseCompetitionLinks();
    // console.log(competitionLinks);
    // await this.competitionService.fetchCompetitionLinks(competitionLinks);

    const calendar = await this.calendarService.getCalendar();
    console.log(calendar[0]);
  }
}
