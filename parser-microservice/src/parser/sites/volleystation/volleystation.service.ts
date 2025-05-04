import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { catchError, delay, map, Observable, of, retry } from 'rxjs';
import * as cheerio from 'cheerio';
import { isValid, parse } from 'date-fns';
import { IVollestationCompetition } from './interfaces/match-list/vollestation-competition.interface';
import { plainToInstance } from 'class-transformer';
import { RawMatch } from './models/match-list/raw-match';
import { Team } from './models/team-list/team';
import { ITeam } from './interfaces/team-list/team.interface';

export interface IVolleystationService {
  getTeams(competition: IVollestationCompetition): Observable<Team[]>;
  getMatches(
    competition: IVollestationCompetition,
    type: 'results' | 'schedule',
  ): Observable<RawMatch[]>;
}

@Injectable()
export class VolleystationService implements IVolleystationService {
  private readonly logger = new Logger(VolleystationService.name);

  constructor(private readonly httpService: HttpService) {}

  getTeams(competition: IVollestationCompetition): Observable<Team[]> {
    const url = new URL(competition.url);
    url.pathname += `teams/`;
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
        const teamsSection = $('section.teams div.team-list');

        return $(teamsSection)
          .find('a.team-box')
          .map((_, el) => {
            const name = $(el).find('div.text-title').text().trim();
            const logoUrl =
              $(el).find('div.logo img').attr('src')?.trim() ?? null;
            const teamHref = $(el).attr('href');
            const match = teamHref?.match(/\/teams\/(\d+-\d+)\//);
            const teamId = match ? match[1] : null;
            const team: ITeam = {
              id: teamId,
              logoUrl,
              name,
            };
            return plainToInstance(Team, team);
          })
          .toArray();
      }),
      catchError((err) => {
        this.logger.error(
          `Ошибка при окончательной обработке ${href}: ${err.message}`,
        );
        return of([]);
      }),
    );
  }

  getMatches(
    competition: IVollestationCompetition,
    type: 'results' | 'schedule',
  ): Observable<RawMatch[]> {
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

        const matches: RawMatch[] = $('div.matches a.table-row')
          .map((_, el) => {
            const dateText = $(el).parent().find('h3').text().trim();
            const timeText = $(el).find('div.status.upcoming').text().trim();

            const fullDateText = timeText
              ? `${dateText} ${timeText}`
              : dateText;

            let formatString: string;

            if (!timeText) {
              formatString = 'dd MMMM yyyy, EEEE';
            } else if (/AM|PM/i.test(timeText)) {
              formatString = 'dd MMMM yyyy, EEEE hh:mm a';
            } else {
              formatString = 'dd MMMM yyyy, EEEE HH:mm';
            }

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

            return plainToInstance(RawMatch, {
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
            });
          })
          .toArray();

        return matches;
      }),
      catchError((err) => {
        this.logger.error(
          `Ошибка при окончательной обработке ${href}: ${err.message}`,
        );
        return of([]);
      }),
    );
  }
}
