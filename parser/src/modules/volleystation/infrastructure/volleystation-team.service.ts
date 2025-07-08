import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';

import * as cheerio from 'cheerio';

export interface IRawTeam {}

class GetTeamsDto {
  competitionBaseUrl: string;
}

@Injectable()
export class VolleystationTeamApiService implements OnApplicationBootstrap {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly httpService: HttpService) {}

  async onApplicationBootstrap() {
    const teams = await this.getTeams({
      competitionBaseUrl: 'https://juniorkimmp.volleystation.com/en/',
    });
    console.log(teams[0]);
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

    const maxRetries = 10;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const response = await this.httpService.axiosRef.get(href);
        const html = response.data;
        const $ = cheerio.load(html);

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

        return teams;
      } catch (error) {
        const status = error?.status || error?.response?.status || 0;

        if (status === 404) {
          this.logger.warn(`Не найдено ${href}`);
          return [];
        }

        retryCount++;

        if (retryCount >= maxRetries) {
          this.logger.error(
            `Ошибка при окончательной обработке ${href}: ${error.message}`,
          );
          return [];
        }

        const delayTime = status === 500 ? 0 : Math.pow(2, retryCount) * 1000;

        this.logger.warn(
          `Повторная попытка №${retryCount + 1} через ${delayTime / 1000} сек (ошибка: ${status} - ${error.message})`,
        );

        if (delayTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayTime));
        }
      }
    }

    return [];
  }
}
