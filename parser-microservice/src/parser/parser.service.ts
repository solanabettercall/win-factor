import { Injectable, OnModuleInit } from '@nestjs/common';
import { CalendarService } from './sites/cve/calendar.service';
import { firstValueFrom } from 'rxjs';
import { CveOldService } from './sites/cve-old/cve-old.service';
import { CompetitionService } from './sites/cve/competition.service';
import { parse } from 'date-fns';

@Injectable()
export class ParserService implements OnModuleInit {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly competitionService: CompetitionService,
    private readonly cveOldService: CveOldService,
  ) {}

  async onModuleInit() {
    const matches = await firstValueFrom(
      this.calendarService.getMatchesInRange(
        parse('01.03.2025', 'dd.MM.yyyy', new Date()),
        parse('01.04.2025', 'dd.MM.yyyy', new Date()),
      ),
    );
    console.log(matches[0]);
    const competitionLinks =
      await this.competitionService.parseCompetitionLinks();
    console.log(competitionLinks);
  }
}
