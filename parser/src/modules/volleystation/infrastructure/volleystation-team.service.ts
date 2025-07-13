import {
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';

import * as cheerio from 'cheerio';
import { HttpClientService } from './http-client.service';
import { TeamId } from 'src/modules/monitoring/domain/value-objects/team-id.vo';
import { Competition } from 'src/modules/monitoring/domain/entities/competition.entity';
import { CompetitionId } from 'src/modules/monitoring/domain/value-objects/competition-id.vo';
import { IRawPlayer } from './volleystation-player.service';
import {
  Observable,
  retry,
  throwError,
  of,
  delay,
  map,
  catchError,
} from 'rxjs';
import {
  IPlayer,
  Player,
} from 'src/modules/monitoring/domain/entities/player.entity';
import { PlayerId } from 'src/modules/monitoring/domain/value-objects/player-id.vo';

export interface IRawTeam {
  id: TeamId;
  competitionId: CompetitionId;
  name: string;
  url: string;
  logoUrl: string | null;
}

export interface IRawDetailedTeam {
  id: TeamId;
  competitionId: CompetitionId;
  name: string;
  url: string;
  playedMatches: number;

  wonMatches: number;

  lostMatches: number;

  playerIds: PlayerId[];
}

class GetTeamsDto {
  competition: Competition;
}

export class GetTeamDto {
  competition: Competition;
  teamId: TeamId;
}

@Injectable()
export class VolleystationTeamApiService implements OnApplicationBootstrap {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly httpService: HttpClientService) {}

  async onApplicationBootstrap() {
    // const team = await this.getTeam({
    //   competition: Competition.create({
    //     id: CompetitionId.create(285),
    //     name: 'Beach',
    //     url: 'https://panel.volleystation.com/website/285/en/',
    //     version: CompetitionVersion.create('website'),
    //   }),
    //   teamId: TeamId.create(2215385, '7471'),
    // });
    // console.log(team);
  }

  private parseTeamsV1(
    $: cheerio.CheerioAPI,
    origin: string,
    competitionId: CompetitionId,
  ): IRawTeam[] {
    const teamsSection = $('section.teams div.team-list');

    return $(teamsSection)
      .find('a.team-box')
      .map((_, el) => {
        const name = $(el).find('div.text-title').text().trim();
        const logoUrl = $(el).find('div.logo img').attr('src')?.trim() ?? null;
        const teamHref: string | undefined = $(el).attr('href');
        if (!teamHref) return null;
        const decodedHref = decodeURI(teamHref);

        const { href: url } = new URL(teamHref, origin);
        const match = decodedHref?.match(/\/teams\/([^/]+)\//);
        const teamId = match ? match[1] : null;
        if (!teamId) return null;
        const rawTeam: IRawTeam = {
          id: TeamId.create(teamId),
          logoUrl,
          name,
          url,
          competitionId,
        };
        return rawTeam;
      })
      .get()
      .filter((team) => !!team.id);
  }

  private parseTeamsV2(
    $: cheerio.CheerioAPI,
    origin: string,
    competitionId: CompetitionId,
  ): IRawTeam[] {
    const teamsSection = $('div.grid.team-grid');

    return $(teamsSection)
      .find('a')
      .map((_, el) => {
        const name = $(el).find('div.team-data h6').text().trim();
        const logoUrl = $(el).find('div.badge img').attr('src')?.trim() ?? null;
        const teamHref = $(el).attr('href');
        if (!teamHref) return null;
        const decodedHref = decodeURI(teamHref);

        const { href: url } = new URL(teamHref, origin);
        const match = decodedHref?.match(/\/teams\/([^/]+)\//);
        const teamId = match ? match[1] : null;
        if (!teamId) return null;
        return {
          id: TeamId.create(teamId),
          logoUrl,
          name,
          url,
          competitionId,
        };
      })
      .get()
      .filter((team) => !!team.id);
  }

  async getTeams(dto: GetTeamsDto): Promise<IRawTeam[]> {
    const { competition } = dto;

    const url = new URL(competition.getUrl());
    url.pathname += `teams/`;
    const { origin, href } = url;

    try {
      const response = await this.httpService.get(href);
      if (!response) return [];
      const html = response.data;
      const $ = cheerio.load(html);

      let teams = this.parseTeamsV1($, origin, competition.getId());
      if (teams.length) {
        this.logger.debug(`Парсер V1 найден: ${teams.length} команд`);
        return teams;
      }

      teams = this.parseTeamsV2($, origin, competition.getId());
      if (teams.length) {
        this.logger.debug(`Парсер V2 найден: ${teams.length} команд`);
        return teams;
      }

      this.logger.warn(`Команды не найдены: ${href}`);
      return [];
    } catch (error) {
      const status = error?.status || error?.response?.status || 0;

      if (status === 404) {
        this.logger.warn(`Страница не найдена: ${href}`);
        return [];
      }

      this.logger.error(
        `Ошибка при получении команд ${href}: ${error.message}`,
      );
      return [];
    }
  }

  async getTeam(dto: GetTeamDto): Promise<IRawDetailedTeam | null> {
    const { competition, teamId } = dto;

    const url = new URL(competition.getUrl());
    url.pathname += `teams/${teamId}/`;
    const pageUrl = url.href;

    try {
      const response = await this.httpService.get(pageUrl);
      if (!response) return null;

      const $ = cheerio.load(response.data);
      const version = competition.getVersion();

      const parsers = version.isV1()
        ? [this.parseTeamV1, this.parseTeamV2]
        : [this.parseTeamV2, this.parseTeamV1];

      for (const parser of parsers) {
        const match = parser.call(this, $, competition, teamId, pageUrl);
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

  private parseTeamV1(
    $: cheerio.CheerioAPI,
    competition: Competition,
    teamId: TeamId,
    url: string,
  ): IRawDetailedTeam | null {
    const teamSection = $('section.team-detail');
    if (teamSection.length === 0) {
      return null;
    }
    const [playedMatches, wonMatches, lostMatches] = $(teamSection)
      .find('div.stats-boxes div.box div.number')
      .map((_, el) => {
        return $(el).text()?.trim() ? parseInt($(el).text()?.trim(), 10) : 0;
      });

    const teamName = $('h1.team-detail-item.name').text().trim();

    const players: IRawPlayer[] = $(teamSection)
      .find('section#team-detail-squad a.player-box')
      .map((_, el): IRawPlayer | null => {
        const href = $(el).attr('href');
        if (!href) return null;
        const { href: playerUrl } = new URL(href, competition.getUrl());
        const match = href.match(/\/players\/(\d+)\//);
        if (!match) return null;
        const photoUrl = $(el).find('div.image-photo img').attr('src') ?? null;
        const number = parseInt(
          $(el).find('div.number').text()?.trim() ?? '0',
          10,
        );
        const name = $(el).find('div.text-name').text()?.trim();
        const position = $(el).find('div.text-position').text()?.trim();
        const id = parseInt(match[1], 10);
        return match
          ? {
              id: PlayerId.create(id),
              url: playerUrl,
              photoUrl,
              number,
              name,
              position,
              competitionId: competition.getId(),
            }
          : null;
      })
      .get()
      .filter(Boolean);

    return {
      id: teamId,
      playedMatches,
      wonMatches,
      lostMatches,
      playerIds: players.map((p) => p.id),
      competitionId: competition.getId(),
      url,
      name: teamName,
    };
  }

  private parseTeamV2(
    $: cheerio.CheerioAPI,
    competition: Competition,
    teamId: TeamId,
    url: string,
  ): IRawDetailedTeam | null {
    const wonMatches = parseInt($('div.won-box h5').text(), 10);
    const lostMatches = parseInt($('div.lost-box h5').text(), 10);
    const playedMatches = wonMatches || 0 + lostMatches || 0;
    const teamName = $('div.team-details-box div.team-name').text().trim();
    const players: IRawPlayer[] = $('a.player-personal-card')
      .map((_, el) => {
        const $el = $(el);
        const href = $el.attr('href');
        const match = href?.match(/\/players\/(\d+)\//);
        if (!match || !href) return null;

        const id = parseInt(match[1], 10);
        const url = new URL(href, competition.getUrl()).href;

        const number =
          parseInt($el.find('h5.shirt-number').text().trim(), 10) || 0;
        const name = $el.find('h6.name').text().trim();
        const position = $el.find('div.position').text().trim();
        const photoUrl = $el.find('div.image img').attr('src') || null;

        const rawPlayer: IRawPlayer = {
          id: PlayerId.create(id),
          name,
          position,
          number,
          url,
          photoUrl,
          competitionId: competition.getId(),
        };
        return rawPlayer;
      })
      .get()
      .filter(Boolean);

    return {
      id: teamId,
      playedMatches,
      wonMatches,
      lostMatches,
      playerIds: players.map((p) => p.id),
      url,
      competitionId: competition.getId(),
      name: teamName,
    };
  }
}
