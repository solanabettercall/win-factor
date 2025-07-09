import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { HttpClientService } from './http-client.service';

export interface IRawPlayer {
  id: number;
  name: string;
  url: string;
  photoUrl: string | null;
  number: number;
  position: string;
}

interface GetPlayersDto {
  competitionBaseUrl: string;
}

@Injectable()
export class VolleystationPlayerApiService implements OnApplicationBootstrap {
  private readonly logger = new Logger(VolleystationPlayerApiService.name);

  constructor(private readonly httpService: HttpClientService) {}

  async onApplicationBootstrap() {
    // const players = await this.getPlayers({
    //   competitionBaseUrl: 'https://juniorkimmp.volleystation.com/en/ ',
    // });
    // console.log(players[0]);
  }

  async getPlayers(dto: GetPlayersDto): Promise<IRawPlayer[]> {
    const url = new URL(dto.competitionBaseUrl);
    url.pathname += 'players/';
    const pageUrl = url.href;

    try {
      const response = await this.httpService.get(pageUrl);
      if (!response) return [];
      const $ = cheerio.load(response.data);

      let players = this.parsePlayersV1($, url.origin);
      if (players.length) {
        this.logger.debug(`Парсер V1 сработал: ${players.length} игроков`);
        return players;
      }

      this.logger.warn(`Парсер V1 не нашёл игроков, пробуем V2: ${pageUrl}`);
      players = this.parsePlayersV2($, url.origin);

      if (players.length) {
        this.logger.debug(`Парсер V2 сработал: ${players.length} игроков`);
      } else {
        this.logger.warn(`Парсер V2 также не нашёл игроков: ${pageUrl}`);
      }

      return players;
    } catch (err) {
      if (err.response?.status === 404) {
        this.logger.warn(`Страница не найдена: ${pageUrl}`);
      } else {
        this.logger.error(`Ошибка при обработке ${pageUrl}: ${err.message}`);
      }
      return [];
    }
  }

  private parsePlayersV1($: cheerio.CheerioAPI, origin: string): IRawPlayer[] {
    const SELECTORS = {
      container: 'a.player-box',
      photoUrl: 'div.image-photo img',
      number: 'div.number',
      name: 'div.text-name',
      position: 'div.text-position',
    };

    return this.parseGeneric($, SELECTORS, origin);
  }

  private parsePlayersV2($: cheerio.CheerioAPI, origin: string): IRawPlayer[] {
    const SELECTORS = {
      container: 'a.player-personal-card',
      photoUrl: 'div.personal-data-box div.image img',
      number: 'h5.shirt-number',
      name: 'div.personal-data h6.name',
      position: 'div.personal-data div.position',
    };

    return this.parseGeneric($, SELECTORS, origin);
  }

  private parseGeneric(
    $: cheerio.CheerioAPI,
    selectors: {
      container: string;
      photoUrl: string;
      number: string;
      name: string;
      position: string;
    },
    origin: string,
  ): IRawPlayer[] {
    const PLAYER_ID_REGEX = /\/players\/(\d+)\//;

    const extractPlayerId = (href: string): number | null => {
      const match = href.match(PLAYER_ID_REGEX);
      return match ? parseInt(match[1], 10) : null;
    };

    return $(selectors.container)
      .map((_, el): IRawPlayer | null => {
        const href = $(el).attr('href');
        if (!href) return null;

        const playerUrl = new URL(href, origin).href;

        const id = extractPlayerId(href);
        if (!id) return null;
        const photoUrl = $(el).find(selectors.photoUrl).attr('src') ?? null;

        const numberText = $(el).find(selectors.number).text().trim();
        const number = numberText ? parseInt(numberText, 10) : 0;
        const name = $(el).find(selectors.name).text().trim();
        const position = $(el).find(selectors.position).text().trim() ?? null;

        return {
          id,
          url: playerUrl,
          photoUrl,
          number,
          name,
          position,
        };
      })
      .get()
      .filter(Boolean) as IRawPlayer[];
  }
}
