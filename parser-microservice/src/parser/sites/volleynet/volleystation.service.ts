import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { catchError, delay, map, of, retry } from 'rxjs';
import * as cheerio from 'cheerio';
import { isValid, parse } from 'date-fns';
import { IVollestationCompetition } from './interfaces/vollestation-competition.interface';

@Injectable()
export class VolleystationService implements OnModuleInit {
  private readonly logger = new Logger(VolleystationService.name);

  constructor(private readonly httpService: HttpService) {}

  async onModuleInit() {}

  getMatches(
    competition: IVollestationCompetition,
    type: 'results' | 'schedule',
  ) {
    const url = new URL(competition.url);
    url.pathname += `${type}/`;
    const { origin, href } = url;

    return this.httpService.get(href).pipe(
      retry({
        count: Infinity,
        delay: (error, retryIndex) => {
          const status = error?.status || 0;
          const delayTime = status === 500 ? 0 : Math.pow(2, retryIndex) * 1000;

          this.logger.warn(
            `Повторная попытка №${retryIndex + 1} через ${delayTime / 1000} сек (ошибка: ${status} - ${error.message})`,
          );

          return of(null).pipe(delay(delayTime));
        },
      }),
      map((response) => response.data),
      map((html) => cheerio.load(html)),
      map(($) => {
        const mainSection = $(`section.match-${type}`);
        if (!mainSection || mainSection.length === 0) {
          this.logger.warn(`Раздел не доступен ${href}`);
          return [];
        }

        const matches = $('div.matches a.table-row')
          .map((_, el) => {
            const dateText = $(el).parent().find('h3').text().trim();
            const timeText = $(el).find('div.status.upcoming').text().trim();
            const fullDateText = timeText
              ? `${dateText} ${timeText}`
              : dateText;
            const formatString = timeText
              ? 'dd MMMM yyyy, EEEE HH:mm'
              : 'dd MMMM yyyy, EEEE';

            const parsedDate = parse(fullDateText, formatString, new Date());

            if (!isValid(parsedDate)) {
              this.logger.warn(`Невалидная дата: ${fullDateText}`);
            }

            const matchHref = $(el).attr('href');

            const match = matchHref.match(/\/matches\/(\d+)/);
            const matchId = match ? parseInt(match[1]) : null;

            const { href: matchUrl } = new URL(matchHref, origin);

            const home = $(el).find('div.home');
            const homeLogoUrl = home.find('div.logo img').attr('src');
            const homeName = home.find('div.name').text().trim();

            const away = $(el).find('div.away');
            const awayLogoUrl = away.find('div.logo img').attr('src');
            const awayName = away.find('div.name').text().trim();

            return {
              date: parsedDate,
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

        return matches;
      }),
      catchError((err) => {
        this.logger.error(
          `Ошибка при окончательной обработке ${href}: ${err.message}`,
        );
        return of([]); // fallback
      }),
    );
  }
}
