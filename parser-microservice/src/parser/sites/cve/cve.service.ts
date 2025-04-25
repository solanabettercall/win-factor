import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CompetitionService } from './competition.service';
import { CalendarService } from './calendar.service';

@Injectable()
export class CveService implements OnModuleInit {
  private readonly logger = new Logger(CveService.name);
  constructor(
    private readonly competitionService: CompetitionService,
    private readonly calendarService: CalendarService,
  ) {}

  async onModuleInit() {
    // const competitionLinks: CompetitionLink[] =
    // await this.competitionService.parseCompetitionLinks();
    // console.log(competitionLinks);
    // await this.competitionService.fetchCompetitionLinks(competitionLinks);
    // for (
    //   let date = new Date(1901, 0, 1);
    //   isBefore(date, new Date());
    //   date = addMonths(date, 1)
    // ) {
    //   const calendar = await this.calendarService.getCalendarByYearMonth(date);
    //   const length = calendar.length;
    //   this.logger.verbose(`${format(date, 'yyyy-MM-dd')}\t${length}`);
    //   if (length > 0) {
    //     break;
    //   }
    //   await new Promise((resolve) => setTimeout(resolve, 1000));
    // }
    // const matches = await this.calendarService.getMatchesInRange(
    //   parse('01.04.2024', 'dd.MM.yyyy', new Date()),
    //   parse('01.04.2025', 'dd.MM.yyyy', new Date()),
    // );
    // console.log(matches.length);
  }
}
