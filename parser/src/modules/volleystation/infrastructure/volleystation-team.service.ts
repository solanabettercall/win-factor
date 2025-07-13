import { Injectable, Logger } from '@nestjs/common';

import * as cheerio from 'cheerio';
import { HttpClientService } from './http-client.service';
import { TeamId } from 'src/modules/monitoring/domain/value-objects/team-id.vo';
import { Competition } from 'src/modules/monitoring/domain/entities/competition.entity';
import { CompetitionId } from 'src/modules/monitoring/domain/value-objects/competition-id.vo';

export interface IRawTeam {
  id: TeamId;
  competitionId: CompetitionId;
  name: string;
  url: string;
  logoUrl: string | null;
}

class GetTeamsDto {
  competition: Competition;
}

@Injectable()
export class VolleystationTeamApiService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly httpService: HttpClientService) {}

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
}
