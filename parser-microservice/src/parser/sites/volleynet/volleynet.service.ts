import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  catchError,
  firstValueFrom,
  mergeMap,
  of,
  range,
  tap,
  timeout,
} from 'rxjs';
import * as cheerio from 'cheerio';
import { parse } from 'date-fns';
// import * as cloudscraper from 'cloudscraper';

const io = require('socket.io-client');

interface IVolleynetCompetition {
  id: number;
  name: string;
  slug: string;
}

type SiteVersion = 'website' | 'website2';

@Injectable()
export class VolleynetService implements OnModuleInit {
  private siteVersion: SiteVersion = 'website2';

  private readonly logger = new Logger(VolleynetService.name);

  private readonly competitions: IVolleynetCompetition[] = [
    {
      id: 122,
      name: 'Austrian Volley League Men',
      slug: 'austrian-volley-league-men',
    },
    {
      id: 121,
      name: 'Austrian Volley League Women',
      slug: 'austrian-volley-league-women',
    },
    {
      id: 125,
      name: 'Austrian Volley League Men | 2',
      slug: '2-bundesliga-herren',
    },

    {
      id: 118,
      name: 'Austrian Volley League Women | 2',
      slug: '2-bundesliga-damen',
    },
  ];

  constructor(private readonly httpService: HttpService) {}
  async onModuleInit() {}

  processCompetition2(url: string) {
    return this.httpService.get(url);
  }

  async processCompetition(
    competition: IVolleynetCompetition,
    type: 'schedule' | 'results',
  ) {
    const { id } = competition;
    const { data: html } = await firstValueFrom(
      this.httpService.get(
        `https://panel.volleystation.com/${this.siteVersion}/${id}/en/${type}/`,
      ),
    );

    const $ = cheerio.load(html);

    if (type === 'schedule') {
      const isScheduleEmpty =
        $('div.tabs div.active').parent().attr('href') !==
        '/website2/125/en/schedule/';
      if (isScheduleEmpty) {
        this.logger.warn(`Для ${competition.name} нет запланированных матчей`);
        return [];
      }
    }

    const matchesLinks = $('div.match-box-helper')
      .map((_, el) => {
        const tagLink = $(el).parent();
        const relativeUrl = tagLink.attr('href');
        const { href: absoluteUrl } = new URL(
          relativeUrl,
          'https://panel.volleystation.com',
        );

        const dateString = tagLink.parent().find('div.day-label').text().trim();
        const timeString =
          tagLink.find('div.start-date').text().trim() || '00:00';
        const fullDateString = `${dateString} ${timeString}`;
        const parsedDate = parse(
          fullDateString,
          'd MMMM yyyy, EEEE HH:mm',
          new Date(),
        );
        const description = $(el).find('div.description');
        const round = $(description).find('div.round-box').text().trim();
        const location = $(description).find('div.location-box').text().trim();

        // console.log(location);
        return round;
      })
      .toArray();
    return matchesLinks;
  }
}
