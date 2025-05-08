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

export interface IVolleystationService {
  getTeams(competition: ICompetition): Observable<Team[]>;
  getTeam(dto: GetTeamDto): Observable<TeamRoster | null>;
  getMatches(dto: GetMatchesDto): Observable<RawMatch[]>;

  getPlayer(dto: GetPlayerDto): Observable<IPlayerProfile>;

  getPlayers(competition: ICompetition): Observable<IPlayer[]>;
  getCompetitions(): Observable<ICompetition[]>;
}

@Injectable()
export class VolleystationService implements IVolleystationService {
  private readonly logger = new Logger(VolleystationService.name);

  constructor(private readonly httpService: HttpService) {}

  getCompetitions(): Observable<ICompetition[]> {
    return of(competitions);
  }

  getPlayers(competition: ICompetition): Observable<IPlayer[]> {
    const url = new URL(competition.url);
    url.pathname += `players/`;
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
        const playerBoxes = $('a.player-box');

        const players: Player[] = $(playerBoxes)
          .map((_, el): Player => {
            const href = $(el).attr('href');
            const { href: playerUrl } = new URL(href, origin);

            const regex = /\/players\/(\d+)\//;
            const match = href.match(regex);

            const photoUrl = $(el).find('div.image-photo img').attr('src');
            const number = parseInt(
              $(el).find('div.number').text()?.trim() ?? '0',
              10,
            );
            const name = $(el).find('div.text-name').text()?.trim();
            const position = $(el).find('div.text-position').text()?.trim();

            const pl: IPlayer = match
              ? {
                  id: parseInt(match[1], 10),
                  url: playerUrl,
                  photoUrl,
                  number,
                  name,
                  position,
                }
              : null;
            return plainToInstance(Player, pl);
          })
          .get()
          .filter(Boolean);

        return plainToInstance(Player, players);
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
        const teamSection = $('section.player-detail');

        const [
          matchesPlayed,
          setsPlayed,
          pointsScored,
          numberOfAces,
          pointsByBlock,
        ] = $(teamSection)
          .find('div.stats-boxes div.box div.number')
          .map((_, el) => {
            return $(el).text()?.trim()
              ? parseInt($(el).text()?.trim(), 10)
              : 0;
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

        // Создадим объект для итоговой статистики, который потом заполним нужными данными
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

          // Для каждой статистической группы извлекаем нужные показатели.
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

        const playerProfile: IPlayerProfile = {
          id: playerId,
          country,
          position,
          name,
          number,
          statistic,
          skills,
        };

        return plainToInstance(PlayerProfile, playerProfile);
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
        const teamSection = $('section.team-detail');

        const [playedMatches, wonMatches, lostMatches] = $(teamSection)
          .find('div.stats-boxes div.box div.number')
          .map((_, el) => {
            return $(el).text()?.trim()
              ? parseInt($(el).text()?.trim(), 10)
              : 0;
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

          // Для каждой статистической группы извлекаем нужные показатели.
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

            const regex = /\/players\/(\d+)\//;
            const match = href.match(regex);

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
              : null; // Если ID не найден, возвращаем null
          })
          .get()
          .filter(Boolean);

        const teamRoster: ITeamRoster = {
          playedMatches,
          wonMatches,
          lostMatches,
          skills: skills,
          players: players,
        };

        return plainToInstance(TeamRoster, teamRoster);
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
        const teamsSection = $('section.teams div.team-list');

        return $(teamsSection)
          .find('a.team-box')
          .map((_, el) => {
            const name = $(el).find('div.text-title').text().trim();
            const logoUrl =
              $(el).find('div.logo img').attr('src')?.trim() ?? null;
            const teamHref = $(el).attr('href');
            const { href: url } = new URL(teamHref, origin);
            const match = teamHref?.match(/\/teams\/([\da-zA-Z-]+)\//);

            const teamId = match ? match[1] : null;
            const team: ITeam = {
              id: teamId,
              logoUrl,
              name,
              url,
            };
            return plainToInstance(Team, team);
          })
          .toArray();
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
