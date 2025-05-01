import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';

interface IVolleynetCompetition {
  id: number;
  name: string;
  slug: string;
}

type SiteVersion = 'website' | 'website2';

@Injectable()
export class VolleynetService implements OnModuleInit {
  private siteVersion: SiteVersion = 'website';

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

  async processCompetition(
    competitionId: number,
    type: 'schedule' | 'results',
  ) {
    const url = `https://panel.volleystation.com/${this.siteVersion}/${competitionId}/en/${type}/`;
    const { data: html } = await firstValueFrom(this.httpService.get(url));

    const $ = cheerio.load(html);

    const mainSection = $(`section.match-${type}`);
    if (!mainSection) {
      this.logger.warn(`Раздел не доступен ${url}`);
      return [];
    }

    const matchesLinks = $('div.matches a.table-row')
      .map((_, el) => {
        const date = $(el).parent().find('h3').text().trim();
        const matchHref = $(el).attr('href');
        const match = matchHref.match(/\/matches\/(\d+)/);
        const matchId = match ? parseInt(match[1]) : null;

        const { href: matchUrl } = new URL(
          matchHref,
          'https://panel.volleystation.com',
        );

        const home = $(el).find('div.home');
        const homeLogoUrl = $(home).find('div.logo img').attr('src');
        const homeName = $(home).find('div.name').text().trim();

        const away = $(el).find('div.away');
        const awayLogoUrl = $(away).find('div.logo img').attr('src');
        const awayName = $(away).find('div.name').text().trim();

        // const relativeUrl = tagLink.attr('href');
        // const { href: absoluteUrl } = new URL(
        //   relativeUrl,
        //   'https://panel.volleystation.com',
        // );

        // const dateString = tagLink.parent().find('div.day-label').text().trim();
        // const timeString =
        //   tagLink.find('div.start-date').text().trim() || '00:00';
        // const fullDateString = `${dateString} ${timeString}`;
        // const parsedDate = parse(
        //   fullDateString,
        //   'd MMMM yyyy, EEEE HH:mm',
        //   new Date(),
        // );
        // const description = $(el).find('div.description');
        // const round = $(description).find('div.round-box').text().trim();
        // const location = $(description).find('div.location-box').text().trim();

        // console.log(location);
        return {
          date,
          id: matchId,
          matchUrl,
          home: {
            logoUrl: homeLogoUrl,
            name: homeName,
          },
          away: {
            logoUrl: awayLogoUrl,
            name: awayName,
          },
        };
      })
      .toArray();
    return matchesLinks;
  }
}
