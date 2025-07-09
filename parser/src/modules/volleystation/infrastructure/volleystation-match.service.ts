import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  UnprocessableEntityException,
} from '@nestjs/common';

import * as cheerio from 'cheerio';
import { HttpClientService } from './http-client.service';
import { MatchId } from 'src/modules/monitoring/domain/value-objects/match-id.vo';
import { TeamId } from 'src/modules/monitoring/domain/value-objects/team-id.vo';
import { Competition } from 'src/modules/monitoring/domain/entities/competition.entity';
interface IRawTeam {
  name: string;
  logoUrl?: string;
}

export interface IRawMatch {
  id: MatchId;
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

export class GetRawDetailedMatchDto {
  competition: Competition;
  matchId: MatchId;
}

export interface IRawDetailedMatch {
  id: MatchId;
  url: string;
  home: IRawDetailedTeam;
  away: IRawDetailedTeam;
}

interface IRawDetailedTeam {
  id: TeamId;
  name: string;
  url: string;
  logoUrl?: string;
}

@Injectable()
export class VolleystationMatchApiService implements OnApplicationBootstrap {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly httpService: HttpClientService) {}

  async onApplicationBootstrap() {
    // const competition = Competition.create({
    //   id: CompetitionId.create(221),
    //   name: 'Test',
    //   url: 'https://panel.volleystation.com/website/221/en/',
    //   version: CompetitionVersion.create('website'),
    // });
    // const competition = Competition.create({
    //   id: CompetitionId.create(221),
    //   name: 'Test',
    //   url: 'https://vnlm.volleystation.com/en/',
    //   version: CompetitionVersion.create('website2'),
    // });
    // const match = await this.getMatch({
    //   competition,
    //   matchId: MatchId.create(2227672),
    // });
    // console.log(match);
  }

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
          id: MatchId.create(matchId),
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
          id: MatchId.create(matchId),
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

  async getMatch(
    dto: GetRawDetailedMatchDto,
  ): Promise<IRawDetailedMatch | null> {
    const { competition, matchId } = dto;

    const url = new URL(competition.getUrl());
    url.pathname += `matches/${matchId}/`;
    const pageUrl = url.href;

    try {
      const response = await this.httpService.get(pageUrl);
      if (!response) return null;

      const $ = cheerio.load(response.data);
      const version = competition.getVersion();

      const parsers = version.isV1()
        ? [this.parseMatchV1, this.parseMatchV2]
        : [this.parseMatchV2, this.parseMatchV1];

      for (const parser of parsers) {
        const match = parser.call(this, $, url, matchId);
        if (match) {
          this.logger.debug(
            `Парсер ${parser.name} сработал: матч ${match.id} найден`,
          );
          return match;
        }
      }

      return null;
    } catch (err) {
      if (err.response?.status === 404) {
        this.logger.warn(`Страница не найдена: ${pageUrl}`);
      } else {
        this.logger.error(`Ошибка при обработке ${pageUrl}: ${err.message}`);
      }
      return null;
    }
  }

  private parseMatchV1(
    $: cheerio.CheerioAPI,
    origin: URL,
    matchId: MatchId,
  ): IRawDetailedMatch | null {
    try {
      const extractTeam = (selector: string) => {
        const el = $(selector);
        const href = el.attr('href');
        if (!href) {
          throw new UnprocessableEntityException(
            'Не удалось получить ссылку на команду',
          );
        }
        const name = el.find('div.name').text().trim();
        if (!name) {
          throw new UnprocessableEntityException(
            'Не удалось получить название команды',
          );
        }
        const url = new URL(href, origin);
        const match = url.pathname.match(/\d+-\w+/);
        const id = match ? TeamId.create(match[0]) : TeamId.create('');

        return { id, name, url: url.href };
      };

      const home = extractTeam('div.rivals a.home');
      const away = extractTeam('div.rivals a.away');

      if (!home || !away) {
        return null;
      }

      return {
        id: matchId,
        url: origin.href,
        home,
        away,
      };
    } catch (err: unknown) {
      if (err instanceof UnprocessableEntityException) {
        this.logger.warn(`Парсер V1: ${err.message}`);
      } else {
        this.logger.warn('Парсер V1 не смог получить матч');
      }
      return null;
    }
  }

  private parseMatchV2(
    $: cheerio.CheerioAPI,
    origin: URL,
    matchId: MatchId,
  ): IRawDetailedMatch | null {
    try {
      const extractTeam = (selector: string) => {
        const el = $(selector);
        const href = el.attr('href');
        if (!href) {
          throw new UnprocessableEntityException(
            'Не удалось извлечь ссылку на команду',
          );
        }
        const name = el.text().trim();
        if (!name) {
          throw new UnprocessableEntityException(
            'Не удалось извлечь название команды',
          );
        }

        const url = new URL(href, origin);
        const match = url.pathname.match(/\d+-\w+/);
        const id = match ? TeamId.create(match[0]) : TeamId.create('');

        return { id, name, url: url.href };
      };

      const home = extractTeam(
        'div.match-score-details div.team.home div.name a',
      );
      const away = extractTeam(
        'div.match-score-details div.team.away div.name a',
      );

      if (!home || !away) {
        return null;
      }

      return {
        id: matchId,
        url: origin.href,
        home,
        away,
      };
    } catch (err: unknown) {
      if (err instanceof UnprocessableEntityException) {
        this.logger.warn(`Парсер V2: ${err.message}`);
      } else {
        this.logger.warn('Парсер V2 не смог получить матч');
      }
      return null;
    }
  }
}
