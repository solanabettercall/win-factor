import { Injectable, Logger } from '@nestjs/common';

import * as cheerio from 'cheerio';
import { HttpClientService } from './http-client.service';
interface IRawTeam {
  name: string;
  logoUrl?: string;
}

export interface IRawMatch {
  id: number;
  matchUrl: string;
  home: IRawTeam;
  away: IRawTeam;
}

export enum MatchListType {
  Schedule = 'schedule',
  Results = 'results',
}

class GetMatchesDto {
  competitionBaseUrl: string;
  type: MatchListType;
}

@Injectable()
export class VolleystationMatchApiService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly httpService: HttpClientService) {}

  private parseMatchesV1(
    $: cheerio.CheerioAPI,
    origin: string,
    type: MatchListType,
  ): IRawMatch[] {
    const mainSection = $(`section.match-${type}`);
    if (!mainSection || mainSection.length === 0) {
      return [];
    }

    const matches: IRawMatch[] = $('div.matches a.table-row')
      .map((_, el) => {
        const matchHref = $(el).attr('href');
        if (!matchHref) return null;
        const match = matchHref?.match(/\/matches\/(\d+)/);
        const matchId = match ? parseInt(match[1]) : null;
        if (!matchId) return null;
        const { href: matchUrl } = new URL(matchHref, origin);

        const home = $(el).find('div.home');
        const homeLogoUrl = home.find('div.logo img').attr('src');
        const homeName = home.find('div.name').text().trim();

        const away = $(el).find('div.away');
        const awayLogoUrl = away.find('div.logo img').attr('src');
        const awayName = away.find('div.name').text().trim();

        return {
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
      .toArray()
      .filter(Boolean);

    return matches;
  }

  private parseMatchesV2(
    $: cheerio.CheerioAPI,
    origin: string,
    type: MatchListType,
  ): IRawMatch[] {
    const selectedValue = $(
      'div.bottom-bar div.lang-picker select option[selected]',
    )
      .attr('value')
      ?.toLowerCase();

    const expectedPath = `/${type.toLowerCase()}/`;

    if (!selectedValue?.includes(expectedPath)) {
      return [];
    }
    const matches: IRawMatch[] = [];

    $('.day-group').each((_, dayGroupEl) => {
      const dayGroup = $(dayGroupEl);

      dayGroup.find('a').each((_, el) => {
        const matchHref = $(el).attr('href');
        if (!matchHref) return false;
        const match = matchHref?.match(/\/matches\/(\d+)/);
        const matchId = match ? parseInt(match[1]) : null;
        if (!matchId) return false;
        const { href: matchUrl } = new URL(matchHref, origin);

        const teams = $(el).find('.team');
        const home = teams.eq(0);
        const away = teams.eq(1);

        const homeLogoUrl = home.find('.team-badge img').attr('src');
        const homeName = home.find('.name').text().trim();

        const awayLogoUrl = away.find('.team-badge img').attr('src');
        const awayName = away.find('.name').text().trim();

        matches.push({
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
      });
    });

    return matches;
  }

  async getMatches(dto: GetMatchesDto): Promise<IRawMatch[]> {
    const { competitionBaseUrl, type } = dto;

    const url = new URL(competitionBaseUrl);
    url.pathname += `${type}/`;

    const { href: pageUrl } = url;

    try {
      const response = await this.httpService.get(pageUrl);
      if (!response) return [];
      const $ = cheerio.load(response.data);

      const matchType =
        type === MatchListType.Results ? 'прошедших' : 'запланированых';

      const matchesV1 = this.parseMatchesV1($, url.origin, type);
      if (matchesV1.length) {
        this.logger.debug(
          `Парсер V1 сработал: ${matchesV1.length} ${matchType} матчей`,
        );
        return matchesV1;
      }

      const matchesV2 = this.parseMatchesV2($, url.origin, type);

      if (matchesV2.length) {
        this.logger.debug(
          `Парсер V2 сработал: ${matchesV1.length} ${matchType} матчей`,
        );
        return matchesV2;
      }

      return [];
    } catch (err) {
      if (err.response?.status === 404) {
        this.logger.warn(`Страница не найдена: ${pageUrl}`);
      } else {
        this.logger.error(`Ошибка при обработке ${pageUrl}: ${err.message}`);
      }
      return [];
    }
  }
}
