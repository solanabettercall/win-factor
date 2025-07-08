import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';

import * as cheerio from 'cheerio';

export interface IRawTeam {
  id: string;
  name: string;
  url: string;
  logoUrl: string | null;
}

class GetTeamsDto {
  competitionBaseUrl: string;
}

@Injectable()
export class VolleystationTeamApiService implements OnApplicationBootstrap {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly httpService: HttpService) {}

  async onApplicationBootstrap() {
    // const teams = await this.getTeams({
    //   competitionBaseUrl: 'https://juniorkimmp.volleystation.com/en/',
    // });
    // console.log(teams[0]);
  }

  private parseTeamsV1($: cheerio.CheerioAPI, origin: string): IRawTeam[] {
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

  private parseTeamsV2($: cheerio.CheerioAPI, origin: string): IRawTeam[] {
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
          id: teamId,
          logoUrl,
          name,
          url,
        };
      })
      .get()
      .filter((team) => !!team.id);
  }

  async getTeams(dto: GetTeamsDto): Promise<IRawTeam[]> {
    const { competitionBaseUrl } = dto;

    const url = new URL(competitionBaseUrl);
    url.pathname += `teams/`;
    const { origin, href } = url;

    try {
      const response = await this.httpService.axiosRef.get(href);
      const html = response.data;
      const $ = cheerio.load(html);

      let teams = this.parseTeamsV1($, origin);
      if (teams.length) {
        this.logger.debug(`Парсер V1 найден: ${teams.length} команд`);
        return teams;
      }

      teams = this.parseTeamsV2($, origin);
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
}
