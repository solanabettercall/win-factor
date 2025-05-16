import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  catchError,
  delay,
  map,
  Observable,
  of,
  retry,
  throwError,
} from 'rxjs';
import * as cheerio from 'cheerio';
import { isValid, parse } from 'date-fns';
import { ICompetition } from './interfaces/vollestation-competition.interface';
import { plainToInstance } from 'class-transformer';
import { RawMatch } from './models/match-list/raw-match';
import { Team } from './models/team-list/team';
import { ITeam } from './interfaces/team-list/team.interface';
import { TeamRoster } from './models/team-roster/team-roster';
import { ITeamRoster } from './interfaces/team-roster/team-roster.interface';
import { AnyNode } from 'domhandler';
import { IPlayer } from './interfaces/team-roster/player.interface';
import { ISkillStatistics } from './interfaces/skills/skill-statistics.interface';
import { IPlayerProfile } from './interfaces/player-profile/player-profile.interface';
import { IPlayerSummaryStatistics } from './interfaces/player-profile/player-summary-statistics.interface';
import { PlayerProfile } from './models/player-profile/player-profile';
import { Player } from './models/team-roster/player';
import { GetPlayerDto } from './dtos/get-player.dto';
import { GetTeamDto } from './dtos/get-team.dto';
import { GetMatchesDto } from './dtos/get-matches.dto';
import { competitions } from './consts/competitions';
import { IBlock } from './interfaces/skills/block.interface';
import { ISpike } from './interfaces/skills/spike.interface';
import { IServe } from './interfaces/skills/serve.interface';
import { IReception } from './interfaces/skills/reception.interface';
import { MatchListType } from './types';
import { GetCompeitionDto } from './dtos/get-competition.dto';
import { Competition } from './models/vollestation-competition';

export interface IVolleystationService {
  getTeams(competition: ICompetition): Observable<Team[]>;
  getTeam(dto: GetTeamDto): Observable<TeamRoster | null>;
  getMatches(dto: GetMatchesDto): Observable<RawMatch[]>;

  getPlayer(dto: GetPlayerDto): Observable<IPlayerProfile>;

  getPlayers(competition: ICompetition): Observable<IPlayer[]>;
  getCompetitions(): Observable<ICompetition[]>;
  getCompetition(dto: GetCompeitionDto): Observable<ICompetition | null>;
}

@Injectable()
export class VolleystationService implements IVolleystationService {
  private readonly logger = new Logger(VolleystationService.name);

  constructor(private readonly httpService: HttpService) {}

  getCompetitions(): Observable<ICompetition[]> {
    return of(competitions);
  }

  getCompetition(dto: GetCompeitionDto): Observable<Competition | null> {
    const { id, version } = dto;
    const website = version === 'v1' ? 'website' : 'website2';
    const href = `https://panel.volleystation.com/${website}/${id}/en/`;

    return this.httpService.get(href).pipe(
      retry({
        count: 10,
        delay: (error, retryIndex) => {
          const status = error?.status || 0;
          if (status === 404) return throwError(() => new NotFoundException());
          if (status === 403) return of(null);
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
        const name = $('title')
          .text()
          .trim()
          .replaceAll('\n', '')
          .replace('Homepage - ', '');
        const competition: ICompetition = { id, name, url: href };
        return competition;
      }),
      catchError((err) => {
        if (err instanceof NotFoundException) {
          this.logger.warn(`Не найдено ${href}`);
          return of(null);
        }
        this.logger.error(
          `Ошибка при окончательной обработке ${href}: ${err.message}`,
        );
        return of(null);
      }),
    );
  }

  // Первый парсер
  private parsePlayersV1($: cheerio.CheerioAPI, origin: string): IPlayer[] {
    return $('a.player-box')
      .map((_, el): IPlayer => {
        const href = $(el).attr('href');
        const { href: playerUrl } = new URL(href, origin);
        const match = href.match(/\/players\/(\d+)\//);
        const photoUrl = $(el).find('div.image-photo img').attr('src');
        const number = parseInt(
          $(el).find('div.number').text()?.trim() ?? '0',
          10,
        );
        const name = $(el).find('div.text-name').text()?.trim();
        const position = $(el).find('div.text-position').text()?.trim();

        return match
          ? {
              id: parseInt(match[1], 10),
              url: playerUrl,
              photoUrl,
              number,
              name,
              position,
            }
          : null;
      })
      .get()
      .filter(Boolean);
  }

  // Второй парсер
  private parsePlayersV2($: cheerio.CheerioAPI, origin: string): IPlayer[] {
    return $('a.player-personal-card')
      .map((_, el): IPlayer => {
        const href = $(el).attr('href');

        const { href: playerUrl } = new URL(href, origin);
        const match = href.match(/\/players\/(\d+)\//);
        const photoUrl = $(el)
          .find('div.personal-data-box div.image img')
          .attr('src');
        const number = parseInt(
          $(el).find('h5.shirt-number').text()?.trim() ?? '0',
          10,
        );
        const name = $(el).find('div.personal-data h6.name').text()?.trim();
        const position = $(el)
          .find('div.personal-data div.position')
          .text()
          ?.trim();

        return match
          ? {
              id: parseInt(match[1], 10),
              url: playerUrl,
              photoUrl,
              number,
              name,
              position,
            }
          : null;
      })
      .get()
      .filter(Boolean);
  }

  getPlayers(competition: ICompetition): Observable<IPlayer[] | null> {
    const url = new URL(competition.url);
    url.pathname += `players/`;
    const { origin, href } = url;

    return this.httpService.get(href).pipe(
      retry({
        count: 10,
        delay: (error, retryIndex) => {
          const status = error?.status || 0;

          if (status === 404) {
            return throwError(() => new NotFoundException());
          }

          const isRetryable = [500, 502, 503, 504, 429, 403].includes(status);
          const baseDelay = isRetryable ? Math.pow(2, retryIndex) * 1000 : 0;

          this.logger.warn(
            `Повторная попытка №${retryIndex + 1} через ${baseDelay / 1000} сек (ошибка: ${status} - ${error.message})`,
          );

          return of(null).pipe(delay(baseDelay));
        },
      }),
      map((response) => response.data),
      map((html) => cheerio.load(html)),
      map(($) => {
        let players = this.parsePlayersV1($, origin);
        if (players.length) {
          this.logger.debug(`Парсер V1 сработал: ${players.length} игроков`);
        } else {
          this.logger.warn(`Парсер V1 не нашёл игроков, пробуем V2: ${href}`);
          players = this.parsePlayersV2($, origin);

          if (players.length) {
            this.logger.debug(`Парсер V2 сработал: ${players.length} игроков`);
          } else {
            this.logger.warn(`Парсер V2 также не нашёл игроков: ${href}`);
          }
        }

        return players.length ? plainToInstance(Player, players) : null;
      }),
      catchError((err) => {
        if (err instanceof NotFoundException) {
          this.logger.warn(`Не найдено ${href}`);
          return of(null);
        }
        this.logger.error(
          `Ошибка при окончательной обработке ${href}: ${err.message}`,
        );
        return of(null);
      }),
    );
  }

  private parsePlayerV1(
    $: cheerio.CheerioAPI,
    playerId: number,
  ): IPlayerProfile | null {
    this.logger.debug('parsePlayerV1');
    const teamSection = $('section.player-detail');
    if (teamSection.length === 0) return null;

    const [
      matchesPlayed,
      setsPlayed,
      pointsScored,
      numberOfAces,
      pointsByBlock,
    ] = $(teamSection)
      .find('div.stats-boxes div.box div.number')
      .map((_, el) => {
        return $(el).text()?.trim() ? parseInt($(el).text()?.trim(), 10) : 0;
      });

    const statistic: IPlayerSummaryStatistics = {
      matchesPlayed,
      setsPlayed,
      pointsScored,
      numberOfAces,
      pointsByBlock,
    };

    const extractStatValue = (
      element: cheerio.Cheerio<AnyNode>,
      label: string,
    ): number => {
      const valueStr = element
        .find('div.general-stats-table-row div.label')
        .filter((_, el) => $(el).text().trim().toLowerCase() === label)
        .closest('div.general-stats-table-row')
        .find('div.value')
        .text()
        .trim();

      return parseFloat(valueStr) || 0;
    };

    const statRows = $(teamSection)
      .find('section#team-detail-general-stats-table div.row')
      .children();

    const skills: ISkillStatistics = {
      block: { points: 0, pointsPerSet: 0 },
      reception: {
        errors: 0,
        negative: 0,
        percentPerfect: 0,
        perfect: 0,
        total: 0,
      },
      serve: { aces: 0, acesPerSet: 0, errors: 0, total: 0 },
      spike: {
        blocked: 0,
        errors: 0,
        percentPerfect: 0,
        perfect: 0,
        total: 0,
      },
    };

    statRows.each((_, table) => {
      const $table = $(table);
      const title = $table.find('div.title').text().trim().toLowerCase();

      switch (title) {
        case 'serve':
          skills.serve = {
            total: extractStatValue($table, 'sum'),
            aces: extractStatValue($table, 'aces'),
            errors: extractStatValue($table, 'aces'),
            acesPerSet: extractStatValue($table, 'aces per set'),
          };
          break;
        case 'reception':
          skills.reception = {
            total: extractStatValue($table, 'sum'),
            errors: extractStatValue($table, 'errors'),
            negative: extractStatValue($table, 'negative'),
            perfect: extractStatValue($table, 'perfect'),
            percentPerfect: extractStatValue($table, '% perfect'),
          };
          break;
        case 'spike':
          skills.spike = {
            total: extractStatValue($table, 'sum'),
            errors: extractStatValue($table, 'errors'),
            blocked: extractStatValue($table, 'blocked'),
            perfect: extractStatValue($table, 'perfect'),
            percentPerfect: extractStatValue($table, '% perfect'),
          };
          break;
        case 'block':
          skills.block = {
            points: extractStatValue($table, 'points'),
            pointsPerSet: extractStatValue($table, 'points per set'),
          };
          break;
        default:
          this.logger.warn(`Неизвестная категория статистики: ${title}`);
      }
    });

    const number = parseInt(
      $('div.player-detail-data-item.number').text()?.trim() ?? '0',
    );
    const name = $('h1.player-detail-data-item.name').text()?.trim();
    const [country, position] = $('div.player-detail-data-item.detail')
      .text()
      ?.trim()
      ?.split(' - ');

    return {
      id: playerId,
      country,
      position,
      name,
      number,
      statistic,
      skills,
    };
  }

  private parsePlayerV2(
    $: cheerio.CheerioAPI,
    playerId: number,
  ): IPlayerProfile | null {
    this.logger.debug('parsePlayerV2');
    const teamSection = $('div.player-details');
    if (teamSection.length === 0) return null;

    const spike: ISpike = (() => {
      const box = $('div.attack-box');
      const total = parseInt(
        box
          .find('div.stat-details .stat-row .label')
          .filter((_, el) => $(el).text().trim().toLowerCase() === 'sum')
          .siblings('.value')
          .text()
          .trim() || '0',
        10,
      );

      const errors = parseInt(
        box
          .find('div.stat-details .stat-row .label')
          .filter((_, el) => $(el).text().trim().toLowerCase() === 'errors')
          .siblings('.value')
          .text()
          .trim() || '0',
        10,
      );

      const blocked = parseInt(
        box
          .find('div.stat-details .stat-row .label')
          .filter((_, el) => $(el).text().trim().toLowerCase() === 'blocked')
          .siblings('.value')
          .text()
          .trim() || '0',
        10,
      );

      const perfect = parseInt(
        box.find('div.points-box .points-value').text().trim() || '0',
        10,
      );

      const percentPerfect = parseFloat(
        box.find('div.percentage-box .value').text().replace('%', '').trim() ||
          '0',
      );

      return {
        total,
        errors,
        blocked,
        perfect,
        percentPerfect,
      };
    })();

    const block: IBlock = (() => {
      const box = $('div.block-box');

      const points = parseInt(
        box.find('div.points-box .points-value').text().trim() || '0',
        10,
      );

      const pointsPerSetStr = box
        .find('div.stat-details .stat-row .label')
        .filter(
          (_, el) => $(el).text().trim().toLowerCase() === 'points per set',
        )
        .siblings('.value')
        .text()
        .trim();

      const pointsPerSet =
        pointsPerSetStr === '-' ? 0 : parseFloat(pointsPerSetStr) || 0;

      return {
        points,
        pointsPerSet,
      };
    })();

    const serve: IServe = (() => {
      const box = $('div.serve-box');

      const extractValue = (label: string): number => {
        const value = box
          .find('div.stat-details .stat-row .label')
          .filter(
            (_, el) =>
              $(el).text().trim().toLowerCase() === label.toLowerCase(),
          )
          .siblings('.value')
          .text()
          .trim();

        return value === '-' ? 0 : parseFloat(value) || 0;
      };

      return {
        total: extractValue('Sum'),
        errors: extractValue('Errors'),
        aces: parseInt(
          box.find('div.points-box .points-value').text().trim() || '0',
          10,
        ),
        acesPerSet: extractValue('Aces per set'),
      };
    })();

    const reception: IReception = (() => {
      const box = $('div.reception-box');

      const extractValue = (label: string): number => {
        const value = box
          .find('div.stat-row .label')
          .filter(
            (_, el) =>
              $(el).text().trim().toLowerCase() === label.toLowerCase(),
          )
          .siblings('.value')
          .text()
          .trim();

        return value === '-' ? 0 : parseFloat(value) || 0;
      };

      const total = extractValue('Sum');
      const perfect = extractValue('Perfect');
      const percentPerfect = total ? +((perfect / total) * 100).toFixed(2) : 0;

      return {
        total,
        errors: extractValue('Errors'),
        negative: extractValue('Negative'),
        perfect,
        percentPerfect,
      };
    })();

    const skills: ISkillStatistics = {
      block,
      reception,
      serve,
      spike,
    };

    const number = parseInt(
      $('div.number-name div.shirt-number').text()?.trim() ?? '0',
    );
    const position = $('div.position-team div.position').text().trim();
    const firstName = $('.name-box .first-name').text().trim();
    const lastName = $('.name-box .last-name').text().trim();
    const name = [firstName, lastName].filter(Boolean).join(' ') || null;

    return {
      id: playerId,
      position,
      name,
      number,
      skills,
    };
  }

  getPlayer(dto: GetPlayerDto): Observable<IPlayerProfile> {
    const { competition, playerId } = dto;
    const url = new URL(competition.url);
    url.pathname += `players/${playerId}/`;
    const { origin, href } = url;

    return this.httpService.get(href).pipe(
      retry({
        count: Infinity,
        delay: (error, retryIndex) => {
          const status = error?.status || 0;
          if (status === 404) return throwError(() => new NotFoundException());
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
        let player = this.parsePlayerV1($, playerId);

        if (player) {
          this.logger.debug(`Парсер V1 сработал: ${player.name}`);
        } else {
          this.logger.warn(`Парсер V1 не сработал, пробуем V2: ${href}`);
          player = this.parsePlayerV2($, playerId);

          if (player) {
            this.logger.debug(`Парсер V2 сработал: ${player.name}`);
          } else {
            this.logger.warn(`Парсер V2 также не сработал: ${href}`);
          }
        }

        return player ? plainToInstance(PlayerProfile, player) : null;
      }),
      catchError((err) => {
        if (err instanceof NotFoundException) {
          this.logger.warn(`Не найдено ${href}`);
          return of(null);
        }
        this.logger.error(
          `Ошибка при окончательной обработке ${href}: ${err.message}`,
        );
        return of(null);
      }),
    );
  }

  private parseTeamV1(
    $: cheerio.CheerioAPI,
    origin: string,
  ): ITeamRoster | null {
    const teamSection = $('section.team-detail');
    if (teamSection.length === 0) {
      return null;
    }
    const [playedMatches, wonMatches, lostMatches] = $(teamSection)
      .find('div.stats-boxes div.box div.number')
      .map((_, el) => {
        return $(el).text()?.trim() ? parseInt($(el).text()?.trim(), 10) : 0;
      });

    const extractStatValue = (
      element: cheerio.Cheerio<AnyNode>,
      label: string,
    ): number => {
      const valueStr = element
        .find('div.general-stats-table-row div.label')
        .filter((_, el) => $(el).text().trim().toLowerCase() === label)
        .closest('div.general-stats-table-row')
        .find('div.value')
        .text()
        .trim();

      return parseFloat(valueStr) || 0;
    };

    const statRows = $(teamSection)
      .find('section#team-detail-general-stats-table div.row')
      .children();

    const skills: ISkillStatistics = {
      block: { points: 0, pointsPerSet: 0 },
      reception: {
        errors: 0,
        negative: 0,
        percentPerfect: 0,
        perfect: 0,
        total: 0,
      },
      serve: { aces: 0, acesPerSet: 0, errors: 0, total: 0 },
      spike: {
        blocked: 0,
        errors: 0,
        percentPerfect: 0,
        perfect: 0,
        total: 0,
      },
    };

    statRows.each((_, table) => {
      const $table = $(table);
      const title = $table.find('div.title').text().trim().toLowerCase();

      switch (title) {
        case 'serve':
          skills.serve = {
            total: extractStatValue($table, 'sum'),
            aces: extractStatValue($table, 'aces'),
            errors: extractStatValue($table, 'aces'),
            acesPerSet: extractStatValue($table, 'aces per set'),
          };
          break;
        case 'reception':
          skills.reception = {
            total: extractStatValue($table, 'sum'),
            errors: extractStatValue($table, 'errors'),
            negative: extractStatValue($table, 'negative'),
            perfect: extractStatValue($table, 'perfect'),
            percentPerfect: extractStatValue($table, '% perfect'),
          };
          break;
        case 'spike':
          skills.spike = {
            total: extractStatValue($table, 'sum'),
            errors: extractStatValue($table, 'errors'),
            blocked: extractStatValue($table, 'blocked'),
            perfect: extractStatValue($table, 'perfect'),
            percentPerfect: extractStatValue($table, '% perfect'),
          };
          break;
        case 'block':
          skills.block = {
            points: extractStatValue($table, 'points'),
            pointsPerSet: extractStatValue($table, 'points per set'),
          };
          break;
        default:
          this.logger.warn(`Неизвестная категория статистики: ${title}`);
      }
    });

    const players: IPlayer[] = $(teamSection)
      .find('section#team-detail-squad a.player-box')
      .map((_, el): IPlayer => {
        const href = $(el).attr('href');
        const { href: playerUrl } = new URL(href, origin);
        const match = href.match(/\/players\/(\d+)\//);

        const photoUrl = $(el).find('div.image-photo img').attr('src');
        const number = parseInt(
          $(el).find('div.number').text()?.trim() ?? '0',
          10,
        );
        const name = $(el).find('div.text-name').text()?.trim();
        const position = $(el).find('div.text-position').text()?.trim();

        return match
          ? {
              id: parseInt(match[1], 10),
              url: playerUrl,
              photoUrl,
              number,
              name,
              position,
            }
          : null;
      })
      .get()
      .filter(Boolean);

    return {
      playedMatches,
      wonMatches,
      lostMatches,
      skills,
      players,
    };
  }

  private parseTeamV2(
    $: cheerio.CheerioAPI,
    origin: string,
  ): ITeamRoster | null {
    const wonMatches = parseInt($('div.won-box h5').text(), 10);
    const lostMatches = parseInt($('div.lost-box h5').text(), 10);
    const playedMatches = wonMatches || 0 + lostMatches || 0;

    const spike: ISpike = (() => {
      const box = $('div.attack-box');
      const total = parseInt(
        box
          .find('div.stat-details .stat-row .label')
          .filter((_, el) => $(el).text().trim().toLowerCase() === 'sum')
          .siblings('.value')
          .text()
          .trim() || '0',
        10,
      );

      const errors = parseInt(
        box
          .find('div.stat-details .stat-row .label')
          .filter((_, el) => $(el).text().trim().toLowerCase() === 'errors')
          .siblings('.value')
          .text()
          .trim() || '0',
        10,
      );

      const blocked = parseInt(
        box
          .find('div.stat-details .stat-row .label')
          .filter((_, el) => $(el).text().trim().toLowerCase() === 'blocked')
          .siblings('.value')
          .text()
          .trim() || '0',
        10,
      );

      const perfect = parseInt(
        box.find('div.points-box .points-value').text().trim() || '0',
        10,
      );

      const percentPerfect = parseFloat(
        box.find('div.percentage-box .value').text().replace('%', '').trim() ||
          '0',
      );

      return {
        total,
        errors,
        blocked,
        perfect,
        percentPerfect,
      };
    })();

    const block: IBlock = (() => {
      const box = $('div.block-box');

      const points = parseInt(
        box.find('div.points-box .points-value').text().trim() || '0',
        10,
      );

      const pointsPerSetStr = box
        .find('div.stat-details .stat-row .label')
        .filter(
          (_, el) => $(el).text().trim().toLowerCase() === 'points per set',
        )
        .siblings('.value')
        .text()
        .trim();

      const pointsPerSet =
        pointsPerSetStr === '-' ? 0 : parseFloat(pointsPerSetStr) || 0;

      return {
        points,
        pointsPerSet,
      };
    })();

    const serve: IServe = (() => {
      const box = $('div.serve-box');

      const extractValue = (label: string): number => {
        const value = box
          .find('div.stat-details .stat-row .label')
          .filter(
            (_, el) =>
              $(el).text().trim().toLowerCase() === label.toLowerCase(),
          )
          .siblings('.value')
          .text()
          .trim();

        return value === '-' ? 0 : parseFloat(value) || 0;
      };

      return {
        total: extractValue('Sum'),
        errors: extractValue('Errors'),
        aces: parseInt(
          box.find('div.points-box .points-value').text().trim() || '0',
          10,
        ),
        acesPerSet: extractValue('Aces per set'),
      };
    })();

    const reception: IReception = (() => {
      const box = $('div.reception-box');

      const extractValue = (label: string): number => {
        const value = box
          .find('div.stat-row .label')
          .filter(
            (_, el) =>
              $(el).text().trim().toLowerCase() === label.toLowerCase(),
          )
          .siblings('.value')
          .text()
          .trim();

        return value === '-' ? 0 : parseFloat(value) || 0;
      };

      const total = extractValue('Sum');
      const perfect = extractValue('Perfect');
      const percentPerfect = total ? +((perfect / total) * 100).toFixed(2) : 0;

      return {
        total,
        errors: extractValue('Errors'),
        negative: extractValue('Negative'),
        perfect,
        percentPerfect,
      };
    })();

    const skills: ISkillStatistics = {
      block,
      reception,
      serve,
      spike,
    };

    const players: IPlayer[] = $('a.player-personal-card')
      .map((_, el) => {
        const $el = $(el);
        const href = $el.attr('href');
        const match = href?.match(/\/players\/(\d+)\//);
        if (!match) return null;

        const id = parseInt(match[1], 10);
        const url = new URL(href, origin).href;

        const number =
          parseInt($el.find('h5.shirt-number').text().trim(), 10) || 0;
        const name = $el.find('h6.name').text().trim();
        const position = $el.find('div.position').text().trim();
        const photoUrl = $el.find('div.image img').attr('src') || null;

        return {
          id,
          name,
          position,
          number,
          url,
          photoUrl,
        };
      })
      .get()
      .filter(Boolean);

    return {
      playedMatches,
      wonMatches,
      lostMatches,
      skills,
      players,
    };
  }

  getTeam(dto: GetTeamDto): Observable<TeamRoster | null> {
    const { competition, teamId } = dto;
    const url = new URL(competition.url);
    url.pathname += `teams/${teamId}/`;
    const { origin, href } = url;

    return this.httpService.get(href).pipe(
      retry({
        count: Infinity,
        delay: (error, retryIndex) => {
          const status = error?.status || 0;
          if (status === 404) return throwError(() => new NotFoundException());
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
        let roster = this.parseTeamV1($, origin);

        if (roster) {
          this.logger.debug(
            `Парсер V1 сработал: ${roster.players.length} игроков`,
          );
        } else {
          this.logger.warn(`Парсер V1 не нашёл команду, пробуем V2: ${href}`);
          roster = this.parseTeamV2($, origin);

          if (roster) {
            this.logger.debug(
              `Парсер V2 сработал: ${roster.players.length} игроков`,
            );
          } else {
            this.logger.warn(`Парсер V2 также не нашёл команду: ${href}`);
          }
        }

        return roster ? plainToInstance(TeamRoster, roster) : null;
      }),
      catchError((err) => {
        if (err instanceof NotFoundException) {
          this.logger.warn(`Не найдено ${href}`);
          return of(null);
        }
        this.logger.error(
          `Ошибка при окончательной обработке ${href}: ${err.message}`,
        );
        return of(null);
      }),
    );
  }

  private parseTeamsV1($: cheerio.CheerioAPI, origin: string): ITeam[] {
    const teamsSection = $('section.teams div.team-list');

    return $(teamsSection)
      .find('a.team-box')
      .map((_, el) => {
        const name = $(el).find('div.text-title').text().trim();
        const logoUrl = $(el).find('div.logo img').attr('src')?.trim() ?? null;
        const teamHref = $(el).attr('href');
        const decodedHref = decodeURI(teamHref);

        const { href: url } = new URL(teamHref, origin);
        const match = decodedHref?.match(/\/teams\/([^/]+)\//);
        const teamId = match ? match[1] : null;

        return {
          id: teamId,
          logoUrl,
          name,
          url,
        };
      })
      .get()
      .filter((team) => !!team.id);
  }

  private parseTeamsV2($: cheerio.CheerioAPI, origin: string): ITeam[] {
    const teamsSection = $('div.grid.team-grid');

    return $(teamsSection)
      .find('a')
      .map((_, el) => {
        const name = $(el).find('div.team-data h6').text().trim();
        const logoUrl = $(el).find('div.badge img').attr('src')?.trim() ?? null;
        const teamHref = $(el).attr('href');
        const decodedHref = decodeURI(teamHref);

        const { href: url } = new URL(teamHref, origin);
        const match = decodedHref?.match(/\/teams\/([^/]+)\//);
        const teamId = match ? match[1] : null;

        return {
          id: teamId,
          logoUrl,
          name,
          url,
        };
      })
      .get()
      .filter((team) => !!team.id);
  }

  getTeams(competition: ICompetition): Observable<Team[]> {
    const url = new URL(competition.url);
    url.pathname += `teams/`;
    const { origin, href } = url;

    return this.httpService.get(href).pipe(
      retry({
        count: Infinity,
        delay: (error, retryIndex) => {
          const status = error?.status || 0;
          if (status === 404) return throwError(() => new NotFoundException());

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
        let teams = this.parseTeamsV1($, origin);
        if (teams.length) {
          this.logger.debug(`Парсер V1 сработал: ${teams.length} команд`);
        } else {
          this.logger.warn(`Парсер V1 не нашёл команды, пробуем V2: ${href}`);
          teams = this.parseTeamsV2($, origin);

          if (teams.length) {
            this.logger.debug(`Парсер V2 сработал: ${teams.length} команд`);
          } else {
            this.logger.warn(`Парсер V2 также не нашёл команды: ${href}`);
          }
        }

        return plainToInstance(Team, teams);
      }),
      catchError((err) => {
        if (err instanceof NotFoundException) {
          this.logger.warn(`Не найдено ${href}`);
          return of([]);
        }
        this.logger.error(
          `Ошибка при окончательной обработке ${href}: ${err.message}`,
        );
        return of([]);
      }),
    );
  }

  private parseMatchesV1(
    $: cheerio.CheerioAPI,
    origin: string,
    type: MatchListType,
  ): RawMatch[] {
    const mainSection = $(`section.match-${type}`);
    if (!mainSection || mainSection.length === 0) {
      return [];
    }

    const matches: RawMatch[] = $('div.matches a.table-row')
      .map((_, el) => {
        const dateText = $(el).parent().find('h3').text().trim();
        const timeText = $(el).find('div.status.upcoming').text().trim();

        const fullDateText = timeText ? `${dateText} ${timeText}` : dateText;

        let formatString: string;
        if (!timeText) {
          formatString = 'dd MMMM yyyy, EEEE';
        } else if (/AM|PM/i.test(timeText)) {
          formatString = 'dd MMMM yyyy, EEEE hh:mm a';
        } else {
          formatString = 'dd MMMM yyyy, EEEE HH:mm';
        }

        const parsedDate = parse(fullDateText, formatString, new Date());
        const matchHref = $(el).attr('href');
        const match = matchHref?.match(/\/matches\/(\d+)/);
        const matchId = match ? parseInt(match[1]) : null;
        const { href: matchUrl } = new URL(matchHref, origin);

        const home = $(el).find('div.home');
        const homeLogoUrl = home.find('div.logo img').attr('src');
        const homeName = home.find('div.name').text().trim();

        const away = $(el).find('div.away');
        const awayLogoUrl = away.find('div.logo img').attr('src');
        const awayName = away.find('div.name').text().trim();

        return plainToInstance(RawMatch, {
          date: isValid(parsedDate) ? parsedDate : null,
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
  }

  private parseMatchesV2(
    $: cheerio.CheerioAPI,
    origin: string,
    type: MatchListType,
  ): RawMatch[] {
    const selectedValue = $(
      'div.bottom-bar div.lang-picker select option[selected]',
    )
      .attr('value')
      ?.toLowerCase();

    const expectedPath = `/${type.toLowerCase()}/`;

    if (!selectedValue?.includes(expectedPath)) {
      return [];
    }
    const matches: RawMatch[] = [];

    $('.day-group').each((_, dayGroupEl) => {
      const dayGroup = $(dayGroupEl);
      const dateText = dayGroup.find('.day-label').text().trim();

      dayGroup.find('a').each((_, el) => {
        const timeText = $(el).find('div.status.upcoming').text().trim();
        const fullDateText = timeText ? `${dateText} ${timeText}` : dateText;

        let formatString: string;
        if (!timeText) {
          formatString = 'dd MMMM yyyy, EEEE';
        } else if (/AM|PM/i.test(timeText)) {
          formatString = 'dd MMMM yyyy, EEEE hh:mm a';
        } else {
          formatString = 'dd MMMM yyyy, EEEE HH:mm';
        }

        const parsedDate = parse(fullDateText, formatString, new Date());
        const matchHref = $(el).attr('href');
        const match = matchHref?.match(/\/matches\/(\d+)/);
        const matchId = match ? parseInt(match[1]) : null;
        const { href: matchUrl } = new URL(matchHref, origin);

        const teams = $(el).find('.team');
        const home = teams.eq(0);
        const away = teams.eq(1);

        const homeLogoUrl = home.find('.team-badge img').attr('src');
        const homeName = home.find('.name').text().trim();

        const awayLogoUrl = away.find('.team-badge img').attr('src');
        const awayName = away.find('.name').text().trim();

        matches.push(
          plainToInstance(RawMatch, {
            date: isValid(parsedDate) ? parsedDate : null,
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
          }),
        );
      });
    });

    return matches;
  }

  getMatches(dto: GetMatchesDto): Observable<RawMatch[]> {
    const { competition, type } = dto;
    const url = new URL(competition.url);
    url.pathname += `${type}/`;
    const { origin, href } = url;

    return this.httpService.get(href).pipe(
      retry({
        count: Infinity,
        delay: (error, retryIndex) => {
          const status = error?.status || 0;
          if (status === 404) return throwError(() => new NotFoundException());
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
        let matches = this.parseMatchesV1($, origin, type);
        if (matches.length) {
          this.logger.debug(`Парсер V1 сработал: ${matches.length} матчей`);
        } else {
          this.logger.warn(`Парсер V1 не сработал, пробуем V2: ${href}`);
          matches = this.parseMatchesV2($, origin, type);
          if (matches.length) {
            this.logger.debug(`Парсер V2 сработал: ${matches.length} матчей`);
          } else {
            this.logger.warn(`Парсер V2 также не нашёл матчи: ${href}`);
          }
        }

        return matches;
      }),
      catchError((err) => {
        if (err instanceof NotFoundException) {
          this.logger.warn(`Не найдено ${href}`);
          return of([]);
        }
        this.logger.error(
          `Ошибка при окончательной обработке ${href}: ${err.message}`,
        );
        return of([]);
      }),
    );
  }
}
